import { text } from '@papas-choice/content';
import { sendEmail } from './email.js';
import { fileToBase64 } from './registration.js';

export async function submitApplication(fields, cv) {
  const url = import.meta.env.VITE_REGISTRATION_LAMBDA_URL;
  if (!url)
    throw new Error(
      text('careers.applications_are_temporarily_unavailable_please_contact_us_direct'),
    );
  if (!cv || !/\.pdf$/i.test(cv.name))
    throw new Error(text('careers.please_upload_your_cv_as_a_pdf'));
  const file = await fileToBase64(cv);
  return sendEmail({
    type: 'careers',
    fields,
    attachment: { name: file.filename, contentBase64: file.base64 },
  });
}
