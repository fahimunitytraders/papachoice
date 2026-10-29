
/**
 * PapaChoice Registration API
 *
 * File:
 * apps/web/src/api/registration.js
 *
 * Sends registration details and proof-of-address
 * documents to AWS Lambda using JSON and Base64.
 */

const LAMBDA_URL =
  import.meta.env.VITE_REGISTRATION_LAMBDA_URL;

const MAX_FILE_SIZE = 3 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

/**
 * Convert a browser File object into Base64.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      reject(
        new Error("Please select a valid file.")
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      reject(
        new Error(
          "The uploaded file must be smaller than 3 MB."
        )
      );
      return;
    }

    const extension = file.name
      .split(".")
      .pop()
      ?.toLowerCase();

    const allowedExtensions = [
      "pdf",
      "jpg",
      "jpeg",
      "png",
    ];

    if (
      !ALLOWED_FILE_TYPES.includes(file.type) &&
      !allowedExtensions.includes(extension)
    ) {
      reject(
        new Error(
          "Only PDF, JPG, JPEG and PNG files are allowed."
        )
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(
          new Error("Unable to read uploaded file.")
        );
        return;
      }

      const commaIndex = result.indexOf(",");

      if (commaIndex === -1) {
        reject(
          new Error("Invalid file encoding.")
        );
        return;
      }

      const base64 = result.slice(
        commaIndex + 1
      );

      if (!base64) {
        reject(
          new Error("Uploaded file is empty.")
        );
        return;
      }

      resolve({
        filename: file.name,
        mimeType:
          file.type ||
          (
            extension === "pdf"
              ? "application/pdf"
              : extension === "png"
                ? "image/png"
                : "image/jpeg"
          ),
        base64,
      });
    };

    reader.onerror = () => {
      reject(
        new Error("Unable to read uploaded file.")
      );
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Check whether a value is a browser File.
 */
function isFile(value) {
  return (
    typeof File !== "undefined" &&
    value instanceof File
  );
}

/**
 * Check whether a value is a Blob.
 */
function isBlob(value) {
  return (
    typeof Blob !== "undefined" &&
    value instanceof Blob
  );
}

/**
 * Convert a Blob into a File.
 */
function blobToFile(blob, filename) {
  return new File(
    [blob],
    filename,
    {
      type:
        blob.type ||
        "image/png",
    }
  );
}

/**
 * Convert the proof-of-address attachment.
 *
 * Supports:
 * - File objects
 * - Blob objects
 * - FileList objects
 * - Existing Base64 attachment objects
 */
async function prepareAttachment(value) {
  if (!value) {
    return null;
  }

  if (isFile(value)) {
    return fileToBase64(value);
  }

  if (isBlob(value)) {
    return fileToBase64(
      blobToFile(value, "attachment.png")
    );
  }

  if (
    typeof FileList !== "undefined" &&
    value instanceof FileList
  ) {
    if (!value.length) {
      return null;
    }

    return fileToBase64(value[0]);
  }

  if (
    typeof value === "object" &&
    typeof value.base64 === "string"
  ) {
    return {
      filename:
        value.filename ||
        value.fileName ||
        value.name ||
        "attachment.pdf",

      mimeType:
        value.mimeType ||
        value.type ||
        "application/pdf",

      base64: value.base64,
    };
  }

  if (
    typeof value === "object" &&
    isFile(value.file)
  ) {
    return fileToBase64(value.file);
  }

  if (
    typeof value === "object" &&
    isBlob(value.file)
  ) {
    return fileToBase64(
      blobToFile(
        value.file,
        value.filename ||
        "attachment.png"
      )
    );
  }

  throw new Error(
    "Invalid attachment format. Please upload the file again."
  );
}

/**
 * Find the proof-of-address document.
 */
function findProofFile(data) {
  const possibleKeys = [
    "proofFile",
    "proof",
    "attachment",
    "document",
    "proofOfAddress",
    "proofOfAddressFile",
    "addressProof",
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

/**
 * Prepare the registration payload.
 *
 * Keeps all form fields, including:
 * - Business information
 * - Contact information
 * - Guarantor information
 * - Signatures
 *
 * Moves the uploaded proof file into a
 * dedicated Base64 attachment object.
 */
export async function prepareRegistrationPayload(
  registrationData
) {
  if (
    !registrationData ||
    typeof registrationData !== "object"
  ) {
    throw new Error(
      "Registration information is missing."
    );
  }

  const fields = {
    ...registrationData,
  };

  const proof = findProofFile(fields);

  let proofFile = null;

  if (proof) {
    proofFile = await prepareAttachment(
      proof.value
    );

    delete fields[proof.key];
  }

  return {
    fields,
    ...(proofFile ? { proofFile } : {}),
  };
}

/**
 * Send registration to AWS Lambda.
 */
export async function submitRegistration(
  registrationData
) {
  if (!LAMBDA_URL) {
    throw new Error(
      "Registration service URL is not configured."
    );
  }

  const payload =
    await prepareRegistrationPayload(
      registrationData
    );

  let response;

  try {
    response = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error(
      "Registration connection failed:",
      error.message
    );

    throw new Error(
      "Unable to connect to registration service."
    );
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Registration service returned an invalid response."
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.error ||
      result.message ||
      "Unable to send registration."
    );
  }

  return result;
}

// Optional aliases for existing imports.
export const sendRegistration =
  submitRegistration;

export const registerBusiness =
  submitRegistration;

export default submitRegistration;
