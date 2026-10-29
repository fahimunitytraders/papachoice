export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_SIGNATURE_BYTES = 160 * 1024;
export const MAX_JSON_BYTES = 300 * 1024;
export const DECLARATION_VERSION = '2026-10-28';
export const DECLARATION_TEXT =
  'I confirm that the information provided is accurate and that I am authorised to submit it for this business. I agree that Papa’s Choice may use these details and documents to review this application and contact me about it.';
export const COUNTRIES = ['United Kingdom', 'Ireland', 'France', 'Germany', 'Netherlands', 'Other'];

export class ValidationError extends Error {
  constructor(message, field = '') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
export const isEmail = (value) =>
  typeof value === 'string' &&
  value.length <= 254 &&
  /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value) &&
  !/[\r\n]/.test(value);

// A fixed field list is shared by the validator and the email formatter.
export const BUSINESS_FIELDS = [
  ['contactName', 'Contact full name', true],
  ['businessName', 'Business / applicant name', true],
  ['companyNumber', 'Company registration number'],
  ['vatNumber', 'VAT registration number'],
  ['email', 'Email address', true, 'email'],
  ['mobile', 'Mobile number', true],
  ['telephone', 'Landline number'],
  ['website', 'Business website', false, 'url'],
];
export const DELIVERY_FIELDS = [
  ['parking', 'Parking / unloading access', true],
  ['forklift', 'Forklift on site', true],
  ['notes', 'Delivery instructions and other notes', false, 'multiline'],
];
export const GUARANTOR_FIELDS = [
  ['guarantorName', 'Guarantor full name', true],
  ['guarantorBirth', 'Birth date', true, 'date'],
  ['guarantorAddress', 'Residential address', true],
  ['guarantorPhone', 'Contact telephone', true],
  ['guarantorEmail', 'Personal email', true, 'email'],
  ['guarantorPosition', 'Company role', true],
  ['guarantorSignature', 'Guarantor signature (typed)', true],
  ['guarantorDate', 'Guarantor signing date', true, 'date'],
];
export const SIGNATORY_FIELDS = [
  ['signatoryName', 'Authorised signatory', true],
  ['signatoryPosition', 'Job title / position', true],
  ['signatoryDate', 'Signing date', true, 'date'],
  ['typedSignature', 'Typed signature'],
];
export const addressFields = (prefix) => [
  [`${prefix}Address`, 'Street address', true],
  [`${prefix}City`, 'Town / city', true],
  [`${prefix}Postcode`, 'Postcode', true],
  [`${prefix}Country`, 'Country', true],
];
export const referenceFields = (n) => [
  [`ref${n}Identifier`, 'Supplier / reference identifier'],
  [`ref${n}Name`, 'Contact person', true],
  [`ref${n}Company`, 'Supplier business name', true],
  ...addressFields(`ref${n}`),
];

export function validateRegistration(input, today = new Date().toISOString().slice(0, 10)) {
  if (!object(input) || !object(input.values))
    throw new ValidationError('Registration details are missing.');
  if (typeof input.differentDelivery !== 'boolean' || typeof input.includeGuarantor !== 'boolean') {
    throw new ValidationError('Please check the delivery and guarantor options.');
  }
  if (input.declarationAccepted !== true || input.declarationVersion !== DECLARATION_VERSION) {
    throw new ValidationError('Please accept the current declaration.', 'declarationAccepted');
  }
  const values = {};
  function fields(definitions) {
    for (const [key, label, required, type] of definitions) {
      const raw = input.values[key] ?? '';
      if (typeof raw !== 'string') throw new ValidationError(`${label} must be text.`, key);
      const value = raw.trim();
      if (required && !value)
        throw new ValidationError(`Please enter ${label.toLowerCase()}.`, key);
      const limit = type === 'multiline' ? 4000 : 500;
      if (
        value.length > limit ||
        /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value) ||
        (type !== 'multiline' && /[\r\n]/.test(value))
      ) {
        throw new ValidationError(`${label} is too long or contains unsupported characters.`, key);
      }
      if (value && type === 'email' && !isEmail(value))
        throw new ValidationError(`Please enter a valid ${label.toLowerCase()}.`, key);
      if (value && type === 'url') {
        let url;
        try {
          url = new URL(value);
        } catch {
          /* Report the same useful error below. */
        }
        if (!url || !['http:', 'https:'].includes(url.protocol) || url.username || url.password)
          throw new ValidationError('Please enter a valid business website URL.', key);
      }
      if (value && type === 'date') {
        const parsed = new Date(`${value}T00:00:00Z`);
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          Number.isNaN(parsed.getTime()) ||
          parsed.toISOString().slice(0, 10) !== value ||
          value > today ||
          value < '1900-01-01'
        ) {
          throw new ValidationError(`${label} must be a valid date no later than today.`, key);
        }
      }
      values[key] = value;
    }
  }
  function country(prefix) {
    if (!COUNTRIES.includes(values[`${prefix}Country`]))
      throw new ValidationError('Please choose a country.', `${prefix}Country`);
    if (values[`${prefix}Country`] === 'Other')
      fields([[`${prefix}OtherCountry`, 'Country name', true]]);
  }
  fields([...BUSINESS_FIELDS, ...addressFields('account'), ...DELIVERY_FIELDS]);
  country('account');
  if (!['Yes', 'No', 'By arrangement'].includes(values.forklift))
    throw new ValidationError('Please choose a forklift option.', 'forklift');
  if (input.differentDelivery) {
    fields(addressFields('delivery'));
    country('delivery');
  }
  for (const n of [1, 2]) {
    fields(referenceFields(n));
    country(`ref${n}`);
  }
  if (input.includeGuarantor) fields(GUARANTOR_FIELDS);
  fields(SIGNATORY_FIELDS);
  const signatureDataUrl = input.signatureDataUrl || '';
  if (
    typeof signatureDataUrl !== 'string' ||
    signatureDataUrl.length > Math.ceil(MAX_SIGNATURE_BYTES / 3) * 4 + 22 ||
    (signatureDataUrl && !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(signatureDataUrl))
  ) {
    throw new ValidationError(
      'Please clear and redraw your signature, or use a typed signature.',
      'signatureDataUrl',
    );
  }
  if (!signatureDataUrl && !values.typedSignature)
    throw new ValidationError('Please draw or type your signature.', 'typedSignature');
  return {
    values,
    differentDelivery: input.differentDelivery,
    includeGuarantor: input.includeGuarantor,
    declarationAccepted: true,
    declarationVersion: DECLARATION_VERSION,
    signatureDataUrl,
  };
}

export function validateProofMetadata(input) {
  if (
    !object(input) ||
    typeof input.name !== 'string' ||
    input.name.length > 200 ||
    /[\x00-\x1f\x7f/\\]/.test(input.name)
  )
    throw new ValidationError('Please choose a document with a simple filename.');
  const extension = input.name.split('.').at(-1).toLowerCase();
  const contentType = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
  }[extension];
  if (!contentType || (input.type && input.type !== contentType))
    throw new ValidationError('Proof of address must be a PDF, JPG or PNG.');
  if (!Number.isInteger(input.size) || input.size <= 0 || input.size > MAX_FILE_BYTES)
    throw new ValidationError('Proof of address must be between 1 byte and 5 MB.');
  return { name: input.name, type: contentType, size: input.size, extension };
}

export function validateSubmissionId(id) {
  if (
    typeof id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)
  )
    throw new ValidationError('The submission reference is invalid. Please reload the form.');
  return id;
}
