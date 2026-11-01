import { text } from '@papas-choice/content';
import { sendEmail } from './email.js';
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
      reject(new Error(text('registration.please_select_a_valid_attachment')));
      return;
    }

    if (file.size === 0) {
      reject(new Error(text('registration.the_selected_file_is_empty')));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(text('registration.the_uploaded_file_must_be_3_mb_or_smaller')));
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      reject(new Error(text('registration.only_pdf_png_jpg_and_jpeg_files_are_allowed')));
      return;
    }

    const mimeType = MIME_TYPES[extension];

    if (file.type && file.type !== mimeType) {
      reject(new Error(text('registration.the_file_type_does_not_match_its_extension')));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error(text('registration.unable_to_read_the_uploaded_file')));
        return;
      }

      const commaIndex = reader.result.indexOf(',');

      if (commaIndex === -1) {
        reject(new Error(text('registration.invalid_file_encoding')));
        return;
      }

      const base64 = reader.result.slice(commaIndex + 1);

      if (!base64) {
        reject(new Error(text('registration.the_uploaded_file_could_not_be_encoded')));
        return;
      }

      resolve({
        filename: file.name,
        mimeType,
        base64,
      });
    };

    reader.onerror = () => {
      reject(new Error(text('registration.unable_to_read_the_uploaded_file')));
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
      throw new Error(text('registration.attachment_content_is_empty'));
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

  throw new Error(text('registration.invalid_attachment_format_please_upload_the_file_again'));
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
    throw new Error(text('registration.registration_information_is_missing'));
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
    throw new Error(text('registration.registration_service_url_is_not_configured'));
  }

  if (
    !registrationData ||
    typeof registrationData !== 'object' ||
    Array.isArray(registrationData)
  ) {
    throw new Error(text('registration.registration_information_is_missing'));
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
    throw new Error(text('registration.please_upload_proof_of_your_business_address'));
  }

  return sendEmail(payload);
}
