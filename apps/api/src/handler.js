import { createHash } from 'node:crypto';
import {
  MAX_JSON_BYTES,
  ValidationError,
  validateRegistration,
  validateProofMetadata,
  validateSubmissionId,
} from '@papas-choice/registration';
import { HttpError } from './errors.js';
import { validateDocument, signatureBytes } from './attachments.js';
import { buildEmail } from './email.js';

export const fingerprint = (registration, proof) =>
  createHash('sha256').update(JSON.stringify({ registration, proof })).digest('hex');
const uncertain = (ticket) =>
  new HttpError(
    409,
    'DELIVERY_UNCONFIRMED',
    `We cannot confirm this submission. Please contact Papa’s Choice with reference ${ticket.reference} before submitting it again.`,
  );

export function createHandler({
  uploads,
  mailer,
  config,
  now = () => Date.now(),
  logger = console,
}) {
  const mode = config.mode || 'email';
  function application(body) {
    const id = validateSubmissionId(body.submissionId);
    const registration = validateRegistration(body.registration);
    const proof = validateProofMetadata(body.proof);
    signatureBytes(registration.signatureDataUrl);
    return {
      registration,
      proof,
      ticket: {
        id,
        proof,
        fingerprint: fingerprint(registration, proof),
        reference: `PC-${id.replaceAll('-', '').slice(0, 12).toUpperCase()}`,
        key: `registrations/${id}/proof.${proof.extension}`,
        createdAt: new Date(now()).toISOString(),
        uploadExpiresAt: Math.floor(now() / 1000) + 15 * 60,
      },
    };
  }
  async function prepare(body) {
    const { ticket } = application(body);
    const upload = await uploads.sign(ticket, 300);
    return {
      status: 201,
      data: {
        submissionId: ticket.id,
        reference: ticket.reference,
        upload,
        expiresAt: ticket.uploadExpiresAt,
      },
    };
  }
  async function submit(body) {
    const { registration, proof, ticket } = application(body);
    const document = await uploads.read(ticket);
    // S3 stores these fields from the signed POST policy. The browser cannot change them.
    if (document.fingerprint !== ticket.fingerprint)
      throw new HttpError(
        409,
        'SUBMISSION_CHANGED',
        'The application has changed. Please upload the document again.',
      );
    if (!Number.isInteger(document.expiresAt) || document.expiresAt <= Math.floor(now() / 1000))
      throw new HttpError(
        410,
        'UPLOAD_EXPIRED',
        'Your upload window has expired. Please submit again.',
      );
    if (!Number.isFinite(Date.parse(document.createdAt)))
      throw new HttpError(
        400,
        'UPLOAD_INVALID',
        'The uploaded document is missing its application details.',
      );
    ticket.createdAt = document.createdAt;
    const bytes = validateDocument(document.bytes, proof);
    const message = buildEmail({ registration, proof, bytes, ticket, config });
    try {
      await mailer.send(message, ticket);
    } catch (error) {
      const rejected = new Set([
        'MessageRejected',
        'BadRequestException',
        'MailFromDomainNotVerifiedException',
        'NotFoundException',
        'TooManyRequestsException',
        'SendingPausedException',
        'AccountSuspendedException',
        'AccessDeniedException',
      ]);
      if (rejected.has(error.name)) {
        logger.error(
          JSON.stringify({
            event: 'email_rejected',
            reference: ticket.reference,
            type: error.name,
          }),
        );
        throw new HttpError(
          503,
          'EMAIL_UNAVAILABLE',
          'We could not send your application. Your details are still on this page. Please try again later or contact us.',
        );
      }
      logger.error(
        JSON.stringify({ event: 'email_delivery_unconfirmed', reference: ticket.reference }),
      );
      throw uncertain(ticket);
    }
    await uploads
      .remove(ticket)
      .catch(() =>
        logger.warn(
          JSON.stringify({ event: 'upload_cleanup_deferred', reference: ticket.reference }),
        ),
      );
    logger.info(
      JSON.stringify({ event: 'registration_accepted', reference: ticket.reference, mode }),
    );
    return { status: 202, data: { ok: true, reference: ticket.reference, mode } };
  }

  return async (event) => {
    const headers = Object.fromEntries(
      Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]),
    );
    const allowed = headers.origin === config.allowedOrigin;
    const response = (statusCode, data) => ({
      statusCode,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        vary: 'Origin',
        ...(allowed
          ? {
              'access-control-allow-origin': config.allowedOrigin,
              'access-control-allow-methods': 'POST, OPTIONS',
              'access-control-allow-headers': 'content-type',
            }
          : {}),
      },
      body: JSON.stringify(data),
    });
    try {
      if (!allowed)
        throw new HttpError(
          403,
          'ORIGIN_NOT_ALLOWED',
          'This website is not allowed to submit applications.',
        );
      const method = event.requestContext?.http?.method;
      const path = event.rawPath;
      if (!['/registrations/uploads', '/registrations'].includes(path))
        throw new HttpError(404, 'NOT_FOUND', 'Endpoint not found.');
      if (method === 'OPTIONS') return response(200, {});
      if (method !== 'POST')
        throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Use POST for this endpoint.');
      if (!/^application\/json(?:\s*;|$)/i.test(headers['content-type'] || ''))
        throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send the application as JSON.');
      if (typeof event.body !== 'string' || event.body.length > MAX_JSON_BYTES * 2)
        throw new HttpError(413, 'REQUEST_TOO_LARGE', 'The application is too large.');
      const raw = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;
      if (Buffer.byteLength(raw) > MAX_JSON_BYTES)
        throw new HttpError(413, 'REQUEST_TOO_LARGE', 'The application is too large.');
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new HttpError(400, 'INVALID_JSON', 'The application could not be read.');
      }
      if (!body || typeof body !== 'object' || Array.isArray(body))
        throw new HttpError(400, 'INVALID_JSON', 'The application could not be read.');
      if (body.websiteTrap)
        throw new HttpError(400, 'INVALID_REQUEST', 'The application could not be submitted.');
      const result = path.endsWith('/uploads') ? await prepare(body) : await submit(body);
      return response(result.status, result.data);
    } catch (error) {
      if (error instanceof ValidationError)
        return response(400, {
          error: { code: 'VALIDATION_ERROR', message: error.message, field: error.field },
        });
      if (error instanceof HttpError)
        return response(error.status, { error: { code: error.code, message: error.message } });
      logger.error(
        JSON.stringify({
          event: 'registration_service_error',
          requestId: event.requestContext?.requestId,
        }),
      );
      return response(503, {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'The registration service is unavailable. Please try again later.',
        },
      });
    }
  };
}
