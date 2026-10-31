import { sendEmail } from './email.js';
import { fileToBase64 } from './registration.js';

export async function submitApplication(fields, cv) {
  const url = import.meta.env.VITE_REGISTRATION_LAMBDA_URL;
  if (!url)
    throw new Error('Applications are temporarily unavailable. Please contact us directly.');
  if (!cv || !/\.pdf$/i.test(cv.name)) throw new Error('Please upload your CV as a PDF.');
  const file = await fileToBase64(cv);
  return sendEmail({
    type: 'careers',
    fields,
    attachment: { name: file.filename, contentBase64: file.base64 },
  });
}
