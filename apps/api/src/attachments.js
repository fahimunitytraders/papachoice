import { MAX_FILE_BYTES, MAX_SIGNATURE_BYTES, ValidationError } from '@papas-choice/registration';

const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
export function validateDocument(bytes, metadata) {
  if (!Buffer.isBuffer(bytes) || bytes.length !== metadata.size || bytes.length > MAX_FILE_BYTES)
    throw new ValidationError('The document size does not match. Please select the file again.');
  const matches = {
    'application/pdf': () =>
      bytes.subarray(0, 5).toString() === '%PDF-' &&
      bytes.subarray(-1024).includes(Buffer.from('%%EOF')),
    'image/png': () =>
      bytes.length >= 33 &&
      bytes.subarray(0, 8).equals(pngHeader) &&
      bytes.subarray(12, 16).toString() === 'IHDR',
    'image/jpeg': () =>
      bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
  };
  if (!matches[metadata.type]?.())
    throw new ValidationError(
      'The uploaded document is not a valid PDF, JPG or PNG of the selected type.',
    );
  return bytes;
}

export function signatureBytes(dataUrl) {
  if (!dataUrl) return null;
  const encoded = dataUrl.slice('data:image/png;base64,'.length);
  const bytes = Buffer.from(encoded, 'base64');
  if (
    bytes.toString('base64') !== encoded ||
    bytes.length > MAX_SIGNATURE_BYTES ||
    bytes.length < 33 ||
    !bytes.subarray(0, 8).equals(pngHeader) ||
    bytes.subarray(12, 16).toString() !== 'IHDR' ||
    bytes.readUInt32BE(16) < 1 ||
    bytes.readUInt32BE(16) > 1600 ||
    bytes.readUInt32BE(20) < 1 ||
    bytes.readUInt32BE(20) > 600
  ) {
    throw new ValidationError('Please clear and redraw the signature, or use a typed signature.');
  }
  return bytes;
}
