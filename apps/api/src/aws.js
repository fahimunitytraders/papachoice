import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { isEmail, MAX_FILE_BYTES } from '@papas-choice/registration';
import { HttpError } from './errors.js';
import { uploadFields } from './uploads.js';

export function awsDependencies(env = process.env, clients = {}) {
  const {
    UPLOAD_BUCKET: bucket,
    FROM_EMAIL: fromEmail,
    TO_EMAIL: toEmail,
    ALLOWED_ORIGIN: allowedOrigin,
  } = env;
  if (
    !bucket ||
    !isEmail(fromEmail) ||
    !isEmail(toEmail) ||
    !allowedOrigin ||
    new URL(allowedOrigin).origin !== allowedOrigin
  )
    throw new Error('Invalid service configuration.');
  const s3 = clients.s3 || new S3Client({});
  // A lost SES response can mean the message was sent. Never automatically retry it.
  const ses = clients.ses || new SESv2Client({ maxAttempts: 1 });
  return {
    config: { fromEmail, toEmail, allowedOrigin },
    uploads: {
      sign(ticket, expires) {
        const fields = uploadFields(ticket);
        return createPresignedPost(s3, {
          Bucket: bucket,
          Key: ticket.key,
          Expires: expires,
          Fields: fields,
          Conditions: [
            ['content-length-range', ticket.proof.size, ticket.proof.size],
            ...Object.entries(fields).map(([name, value]) => ['eq', `$${name}`, value]),
          ],
        });
      },
      async read(ticket) {
        let object;
        try {
          object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: ticket.key }));
        } catch (error) {
          if (error.name === 'NoSuchKey')
            throw new HttpError(
              409,
              'DELIVERY_UNCONFIRMED',
              `This document is no longer available. Please contact us with reference ${ticket.reference} before submitting again.`,
            );
          throw error;
        }
        if (
          object.ContentLength !== ticket.proof.size ||
          object.ContentLength > MAX_FILE_BYTES ||
          object.ContentType !== ticket.proof.type
        ) {
          object.Body?.destroy();
          throw new HttpError(
            400,
            'UPLOAD_INVALID',
            'The uploaded file does not match your chosen document.',
          );
        }
        return {
          bytes: Buffer.from(await object.Body.transformToByteArray()),
          fingerprint: object.Metadata?.['application-hash'],
          createdAt: object.Metadata?.['created-at'],
          expiresAt: Number(object.Metadata?.['expires-at']),
        };
      },
      remove: (ticket) => s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: ticket.key })),
    },
    mailer: {
      async send(message) {
        const result = await ses.send(new SendEmailCommand(message));
        if (!result.MessageId) throw new Error('Missing SES receipt');
        return result.MessageId;
      },
    },
  };
}
