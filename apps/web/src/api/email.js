import { text } from '@papas-choice/content';
export async function sendEmail(payload) {
  const url = import.meta.env.VITE_REGISTRATION_LAMBDA_URL;
  if (!url)
    throw new Error(
      text('email.email_submissions_are_temporarily_unavailable_please_contact_us_d'),
    );
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error(text('email.unable_to_connect_please_try_again'));
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true)
    throw new Error(
      result?.error || result?.message || text('email.unable_to_send_please_try_again'),
    );
  return result;
}
