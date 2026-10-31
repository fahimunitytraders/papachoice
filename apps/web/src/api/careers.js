import { fileToBase64 } from './registration.js';

export async function submitApplication(fields, cv) {
  const url = import.meta.env.VITE_CAREERS_LAMBDA_URL;
  if (!url)
    throw new Error('Applications are temporarily unavailable. Please contact us directly.');
  if (!cv || !/\.pdf$/i.test(cv.name)) throw new Error('Please upload your CV as a PDF.');
  const file = await fileToBase64(cv);
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields,
        attachment: { name: file.filename, contentBase64: file.base64 },
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error('Unable to connect to the application service. Please try again.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true)
    throw new Error(result?.message || 'Unable to submit your application. Please try again.');
  return result;
}
