const LAMBDA_URL = import.meta.env.VITE_REGISTRATION_LAMBDA_URL;

const MAX_FILE_SIZE = 3 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

const MIME_TYPES = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (typeof File === 'undefined' || !(file instanceof File)) {
      reject(new Error('Please select a valid attachment.'));
      return;
    }

    if (file.size === 0) {
      reject(new Error('The selected file is empty.'));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('The uploaded file must be 3 MB or smaller.'));
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      reject(new Error('Only PDF, PNG, JPG and JPEG files are allowed.'));
      return;
    }

    const mimeType = MIME_TYPES[extension];

    if (file.type && file.type !== mimeType) {
      reject(new Error('The file type does not match its extension.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unable to read the uploaded file.'));
        return;
      }

      const commaIndex = reader.result.indexOf(',');

      if (commaIndex === -1) {
        reject(new Error('Invalid file encoding.'));
        return;
      }

      const base64 = reader.result.slice(commaIndex + 1);

      if (!base64) {
        reject(new Error('The uploaded file could not be encoded.'));
        return;
      }

      resolve({
        filename: file.name,
        mimeType,
        base64,
      });
    };

    reader.onerror = () => {
      reject(new Error('Unable to read the uploaded file.'));
    };

    reader.readAsDataURL(file);
  });
}

async function prepareAttachment(value) {
  if (!value) {
    return null;
  }

  if (typeof File !== 'undefined' && value instanceof File) {
    return fileToBase64(value);
  }

  if (typeof FileList !== 'undefined' && value instanceof FileList) {
    if (value.length === 0) {
      return null;
    }

    return fileToBase64(value[0]);
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    const extension =
      value.type === 'application/pdf' ? 'pdf' : value.type === 'image/jpeg' ? 'jpg' : 'png';

    const file = new File([value], `attachment.${extension}`, {
      type: value.type || MIME_TYPES[extension],
    });

    return fileToBase64(file);
  }

  if (typeof value === 'object' && typeof value.base64 === 'string') {
    if (!value.base64.trim()) {
      throw new Error('Attachment content is empty.');
    }

    return {
      filename: value.filename || value.fileName || value.name || 'attachment.pdf',
      mimeType: value.mimeType || value.type || 'application/pdf',
      base64: value.base64,
    };
  }

  if (typeof value === 'object' && value.file) {
    return prepareAttachment(value.file);
  }

  throw new Error('Invalid attachment format. Please upload the file again.');
}

function findProofFile(data) {
  const possibleKeys = [
    'proofFile',
    'proof',
    'attachment',
    'document',
    'proofOfAddress',
    'proofOfAddressFile',
    'addressProof',
  ];

  for (const key of possibleKeys) {
    if (data[key]) {
      return {
        key,
        value: data[key],
      };
    }
  }

  return null;
}

export async function prepareRegistrationPayload(registrationData) {
  if (
    !registrationData ||
    typeof registrationData !== 'object' ||
    Array.isArray(registrationData)
  ) {
    throw new Error('Registration information is missing.');
  }

  const fields = { ...registrationData };

  const foundProof = findProofFile(fields);

  let proofFile = null;

  if (foundProof) {
    proofFile = await prepareAttachment(foundProof.value);
    delete fields[foundProof.key];
  }

  return {
    fields,
    ...(proofFile ? { proofFile } : {}),
  };
}

export async function submitRegistration(registrationData, proof = null, signatureImage = null) {
  if (!LAMBDA_URL) {
    throw new Error('Registration service URL is not configured.');
  }

  if (
    !registrationData ||
    typeof registrationData !== 'object' ||
    Array.isArray(registrationData)
  ) {
    throw new Error('Registration information is missing.');
  }

  const data = {
    ...registrationData,
  };
  if (proof) {
    data.proofFile = proof;
  }
  if (signatureImage) {
    data.signatureImage = signatureImage;
  }

  const payload = await prepareRegistrationPayload(data);
  if (!payload.proofFile) {
    throw new Error('Please upload proof of your business address.');
  }

  let response;

  try {
    response = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Registration connection failed:', error);

    throw new Error('Unable to connect to the registration service. Please try again.');
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error('The registration service returned an invalid response.');
  }

  if (!response.ok || result.success !== true) {
    throw new Error(
      result.error || result.message || 'Unable to send registration. Please try again.',
    );
  }

  return result;
}
