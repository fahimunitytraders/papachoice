export async function sendEmail(payload) {
  const url = import.meta.env.VITE_REGISTRATION_LAMBDA_URL;
  if (!url)
    throw new Error('Email submissions are temporarily unavailable. Please contact us directly.');
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error('Unable to connect. Please try again.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true)
    throw new Error(result?.error || result?.message || 'Unable to send. Please try again.');
  return result;
}
