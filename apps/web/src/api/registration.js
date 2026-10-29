const LAMBDA_URL = import.meta.env.VITE_REGISTRATION_LAMBDA_URL;
const MAX_FILE_BYTES = 3 * 1024 * 1024;

function fileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the uploaded document.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(file);
  });
}

export async function submitRegistration(fields, proofFile, signatureDataUrl = null) {
  if (!LAMBDA_URL) throw new Error('Registration endpoint is not configured.');
  if (!proofFile) throw new Error('Please attach proof of your business address.');
  if (proofFile.size > MAX_FILE_BYTES) throw new Error('The document must be 3 MB or smaller.');
  const ext = proofFile.name.split('.').pop()?.toLowerCase();
  if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
    throw new Error('Only PDF, PNG and JPG documents are accepted.');
  }
  const payload = {
    fields,
    attachment: {
      name: proofFile.name,
      contentBase64: await fileAsBase64(proofFile),
    },
    signatureImageBase64: signatureDataUrl ? signatureDataUrl.split(',')[1] : null,
  };
  let response;
  try {
    response = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to connect to registration service. Please try again.');
  }
  let result;
  try { result = await response.json(); }
  catch { throw new Error('Registration service returned an invalid response.'); }
  if (!response.ok || result.success !== true) {
    throw new Error(result.message || 'Unable to send registration.');
  }
  return result;
}
