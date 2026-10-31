import { jobs } from '../web/src/data/jobs.js';
import { reply, safeHeader, validateFile, b64Lines, googleJson } from './index.mjs';

export async function handler(event) {
  if (event.requestContext?.http?.method !== 'POST') return reply(405, 'Method not allowed.');
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_FROM } = process.env;
  const to = process.env.GMAIL_CAREERS_TO || process.env.GMAIL_TO;
  if (![GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_FROM, to].every(Boolean))
    return reply(503, 'Applications are temporarily unavailable. Please contact us directly.');
  let fields, attachment, job;
  try {
    if (typeof event.body !== 'string' || event.body.length > 5_700_000)
      return reply(413, 'Request too large.');
    const payload = JSON.parse(
      event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body,
    );
    fields = payload.fields;
    job = jobs.find((j) => j.id === fields?.jobId);
    if (
      !job ||
      fields.consent !== true ||
      ['name', 'email', 'message'].some(
        (k) => typeof fields[k] !== 'string' || !fields[k].trim(),
      ) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) ||
      fields.name.length > 200 ||
      fields.email.length > 254 ||
      fields.message.length > 10000 ||
      (fields.phone != null && (typeof fields.phone !== 'string' || fields.phone.length > 100))
    )
      return reply(400, 'Please provide a valid role, contact details, message and consent.');
    attachment = validateFile(payload.attachment);
    if (attachment.mime !== 'application/pdf') return reply(400, 'Please upload your CV as a PDF.');
  } catch {
    return reply(
      400,
      'Please check your application and upload a valid PDF CV no larger than 3 MB.',
    );
  }
  try {
    const boundary = 'careers_' + crypto.randomUUID().replaceAll('-', '');
    const subject = `PapaChoice application: ${job.title} — ${safeHeader(fields.name)}`;
    const body = `Role: ${job.title}\nName: ${fields.name}\nEmail: ${fields.email}\nPhone: ${fields.phone || 'Not provided'}\n\n${fields.message}\n\nApplicant consent: accepted`;
    const mime = [
      `From: ${safeHeader(GMAIL_FROM)}`,
      `To: ${safeHeader(to)}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      b64Lines(Buffer.from(body)),
      `--${boundary}`,
      'Content-Type: application/pdf; name="cv.pdf"',
      'Content-Disposition: attachment; filename="cv.pdf"',
      'Content-Transfer-Encoding: base64',
      '',
      b64Lines(attachment.data),
      `--${boundary}--`,
      '',
    ].join('\r\n');
    const token = await googleJson('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        refresh_token: GMAIL_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });
    if (!token.access_token) throw new Error('Missing access token');
    await googleJson('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token.access_token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ raw: Buffer.from(mime).toString('base64url') }),
    });
    return reply(200, 'Application accepted for sending.', true);
  } catch {
    return reply(502, 'Unable to send your application. Please try again.');
  }
}
