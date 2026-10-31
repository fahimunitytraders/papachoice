const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const MAX_REQUEST_BYTES = 5_700_000;
const ALLOWED = new Map([
  ['pdf', 'application/pdf'],
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
]);

export function reply(statusCode, message, success = false) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ success, message }),
  };
}
export function safeHeader(value) {
  return String(value)
    .replace(/[\r\n]/g, ' ')
    .slice(0, 200);
}
export function validateFile(item) {
  if (!item || typeof item.name !== 'string' || typeof item.contentBase64 !== 'string')
    throw new Error('Missing attachment.');
  const name = item.name.split(/[\\/]/).pop().slice(0, 120);
  const ext = name.split('.').pop()?.toLowerCase();
  const mime = ALLOWED.get(ext);
  if (
    !mime ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(item.contentBase64) ||
    item.contentBase64.length % 4 !== 0
  )
    throw new Error('Invalid attachment format.');
  const data = Buffer.from(item.contentBase64, 'base64');
  if (!data.length || data.length > MAX_ATTACHMENT_BYTES)
    throw new Error('Attachment must be 3 MB or smaller.');
  const magic =
    mime === 'application/pdf'
      ? data.subarray(0, 5).toString() === '%PDF-'
      : mime === 'image/png'
        ? data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
        : data.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'));
  if (!magic) throw new Error('Attachment content does not match its file type.');
  return { name, mime, data };
}
export function b64Lines(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/.{1,76}/g, '$&\r\n')
    .trimEnd();
}
function formatFields(fields) {
  const names = {
    contactName: 'Contact full name',
    businessName: 'Business / applicant name',
    companyNumber: 'Company registration number',
    vatNumber: 'VAT number',
    email: 'Email',
    mobile: 'Mobile',
    telephone: 'Landline',
    website: 'Website',
    accountAddress: 'Business street address',
    accountCity: 'Business city',
    accountPostcode: 'Business postcode',
    accountCountry: 'Business country',
    accountOtherCountry: 'Business other country',
    differentDeliveryAddress: 'Different delivery address',
    deliveryAddress: 'Delivery street address',
    deliveryCity: 'Delivery city',
    deliveryPostcode: 'Delivery postcode',
    deliveryCountry: 'Delivery country',
    deliveryOtherCountry: 'Delivery other country',
    parking: 'Parking / unloading',
    forklift: 'Forklift on site',
    notes: 'Delivery notes',
    ref1Identifier: 'Reference 1 identifier',
    ref1Name: 'Reference 1 contact',
    ref1Company: 'Reference 1 company',
    ref1Address: 'Reference 1 address',
    ref1City: 'Reference 1 city',
    ref1Postcode: 'Reference 1 postcode',
    ref1Country: 'Reference 1 country',
    ref1OtherCountry: 'Reference 1 other country',
    ref2Identifier: 'Reference 2 identifier',
    ref2Name: 'Reference 2 contact',
    ref2Company: 'Reference 2 company',
    ref2Address: 'Reference 2 address',
    ref2City: 'Reference 2 city',
    ref2Postcode: 'Reference 2 postcode',
    ref2Country: 'Reference 2 country',
    ref2OtherCountry: 'Reference 2 other country',
    creditAccountRequested: 'Credit account guarantor requested',
    guarantorName: 'Guarantor full name',
    guarantorBirth: 'Guarantor birth date',
    guarantorAddress: 'Guarantor residential address',
    guarantorPhone: 'Guarantor telephone',
    guarantorEmail: 'Guarantor email',
    guarantorPosition: 'Guarantor position',
    guarantorSignature: 'Guarantor typed signature',
    guarantorDate: 'Guarantor signing date',
    signatoryName: 'Authorised signatory',
    signatoryPosition: 'Signatory position',
    signatoryDate: 'Signing date',
    typedSignature: 'Typed signature',
    declarationAccepted: 'Declaration accepted',
  };
  return Object.entries(fields)
    .filter(([k, v]) => Object.hasOwn(names, k) && v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${names[k]}: ${String(v).slice(0, 5000)}`)
    .join('\n');
}
function makeMime(fields, attachment, signature, from, to) {
  const boundary = 'papachoice_' + crypto.randomUUID().replace(/-/g, '');
  const subject = `PapaChoice registration: ${safeHeader(fields.businessName)}`;
  const body = `New PapaChoice business registration\n\n${formatFields(fields)}\n\nAttachment: ${attachment.name}\n`;
  const chunks = [
    `From: ${safeHeader(from)}`,
    `To: ${safeHeader(to)}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    b64Lines(Buffer.from(body, 'utf8')),
    `--${boundary}`,
    `Content-Type: ${attachment.mime}; name="document.${attachment.name.split('.').pop()}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="document.${attachment.name.split('.').pop()}"`,
    '',
    b64Lines(attachment.data),
  ];
  if (signature)
    chunks.push(
      `--${boundary}`,
      'Content-Type: image/png; name="signature.png"',
      'Content-Transfer-Encoding: base64',
      'Content-Disposition: attachment; filename="signature.png"',
      '',
      b64Lines(signature.data),
    );
  chunks.push(`--${boundary}--`, '');
  return chunks.join('\r\n');
}
export async function googleJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google API returned HTTP ${res.status}`);
  return data;
}
export const handler = async (event) => {
  if (event.requestContext?.http?.method !== 'POST') return reply(405, 'Method not allowed.');
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_FROM, GMAIL_TO } =
    process.env;
  if (
    ![GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_FROM, GMAIL_TO].every(
      Boolean,
    )
  )
    return reply(500, 'Email service is not configured.');
  try {
    const raw = event.body || '';
    if (raw.length > MAX_REQUEST_BYTES) return reply(413, 'Request too large.');
    const payload = JSON.parse(
      event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw,
    );
    const fields = payload?.fields;
    if (!fields || typeof fields !== 'object' || Array.isArray(fields))
      return reply(400, 'Missing registration details.');
    const required = [
      'contactName',
      'businessName',
      'email',
      'mobile',
      'accountAddress',
      'accountCity',
      'accountPostcode',
    ];
    if (
      required.some((k) => typeof fields[k] !== 'string' || !fields[k].trim()) ||
      fields.declarationAccepted !== true
    )
      return reply(400, 'Required registration fields or declaration missing.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      return reply(400, 'Invalid email address.');
    if (JSON.stringify(fields).length > 100_000)
      return reply(413, 'Registration details are too large.');
    let attachment;
    try {
      attachment = validateFile(payload.attachment);
    } catch (err) {
      return reply(400, err.message);
    }
    let signature = null;
    if (payload.signatureImageBase64) {
      try {
        signature = validateFile({
          name: 'signature.png',
          contentBase64: payload.signatureImageBase64,
        });
      } catch {
        return reply(400, 'Invalid drawn signature.');
      }
      if (signature.data.length > 350_000) return reply(413, 'Drawn signature image is too large.');
    }
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
    if (!token.access_token) throw new Error('No access token received.');
    const mime = makeMime(fields, attachment, signature, GMAIL_FROM, GMAIL_TO);
    const rawMessage = Buffer.from(mime).toString('base64url');
    await googleJson('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token.access_token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ raw: rawMessage }),
    });
    return reply(200, 'Registration email accepted by Gmail for sending.', true);
  } catch (err) {
    console.error(
      'Registration email failed:',
      err instanceof SyntaxError ? 'Invalid JSON' : 'Upstream processing error',
    );
    return reply(
      err instanceof SyntaxError ? 400 : 502,
      'Unable to send registration email. Please try again.',
    );
  }
};
