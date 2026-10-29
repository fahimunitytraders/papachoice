import { validateProofMetadata, validateRegistration } from '@papas-choice/registration';

export class SubmissionError extends Error {
  constructor(message, code = 'NETWORK_ERROR') {
    super(message);
    this.code = code;
  }
}
export const registrationConfigured = () =>
  Boolean(import.meta.env.VITE_REGISTRATION_API_URL?.trim());
export const registrationLocalPreview = () =>
  /^http:\/\/(localhost|127\.0\.0\.1):3001\/?$/.test(
    import.meta.env.VITE_REGISTRATION_API_URL?.trim() || '',
  );

export async function submitRegistration(
  { submissionId, registration, proof, websiteTrap = '', onProgress = () => {} },
  options = {},
) {
  const baseUrl = (options.baseUrl ?? import.meta.env.VITE_REGISTRATION_API_URL ?? '')
    .trim()
    .replace(/\/$/, '');
  const fetcher = options.fetchImpl || globalThis.fetch;
  if (!baseUrl)
    throw new SubmissionError(
      'Online registration is not available yet. Please contact Papa’s Choice to apply.',
      'NOT_CONFIGURED',
    );
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    /* Report a configuration error below. */
  }
  if (
    !url ||
    (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new SubmissionError(
      'The registration service is not configured correctly. Please contact us.',
      'NOT_CONFIGURED',
    );
  const validated = validateRegistration(registration);
  const metadata = validateProofMetadata(proof);
  async function request(path, body, emailStage = false, reference = '') {
    const unconfirmed = () =>
      new SubmissionError(
        `We could not confirm your submission. Please contact Papa’s Choice${reference ? ` with reference ${reference}` : ''} before submitting again.`,
        'DELIVERY_UNCONFIRMED',
      );
    let response;
    try {
      response = await fetcher(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000),
      });
    } catch {
      if (emailStage) throw unconfirmed();
      throw new SubmissionError(
        'We could not prepare your upload. Check your connection and try again.',
      );
    }
    let data;
    try {
      data = await response.json();
    } catch {
      if (emailStage) throw unconfirmed();
      throw new SubmissionError(
        'The service returned an unexpected response. Keep this page open and try again.',
      );
    }
    if (!response.ok) {
      if (emailStage && !data.error?.code) throw unconfirmed();
      throw new SubmissionError(
        data.error?.message || 'The application could not be submitted. Please try again later.',
        data.error?.code || 'SERVICE_UNAVAILABLE',
      );
    }
    return data;
  }
  onProgress('Preparing application…');
  const ticket = await request('/registrations/uploads', {
    submissionId,
    registration: validated,
    proof: metadata,
    websiteTrap,
  });
  if (!ticket.upload?.url || !ticket.upload?.fields)
    throw new SubmissionError('The document upload could not be prepared. Please try again.');
  onProgress('Uploading document…');
  const multipart = new FormData();
  for (const [key, value] of Object.entries(ticket.upload.fields)) multipart.append(key, value);
  multipart.append('file', proof, proof.name);
  let upload;
  try {
    upload = await fetcher(ticket.upload.url, {
      method: 'POST',
      body: multipart,
      signal: AbortSignal.timeout(90000),
    });
  } catch {
    throw new SubmissionError(
      'The document could not be uploaded. Check your connection and try again.',
      'UPLOAD_FAILED',
    );
  }
  if (!upload.ok)
    throw new SubmissionError(
      'The document upload failed or expired. Please try again.',
      'UPLOAD_FAILED',
    );
  onProgress('Sending application…');
  const result = await request(
    '/registrations',
    {
      submissionId,
      registration: validated,
      proof: metadata,
      websiteTrap,
    },
    true,
    ticket.reference,
  );
  return receipt(result);
}

function receipt(result) {
  if (
    result.ok !== true ||
    typeof result.reference !== 'string' ||
    !result.reference ||
    !['email', 'preview'].includes(result.mode)
  )
    throw new SubmissionError(
      'We could not confirm your submission. Please contact Papa’s Choice before submitting again.',
      'DELIVERY_UNCONFIRMED',
    );
  return result;
}
