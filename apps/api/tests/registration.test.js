import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistration, MAX_FILE_BYTES } from '@papas-choice/registration';
import { createHandler } from '../src/handler.js';
import { localDependencies } from '../src/local.js';
import { registrationFixture, submissionId, pngBase64 } from './fixtures.js';

const pdf = Buffer.from('%PDF-1.4\nSample business document\n%%EOF');
const metadata = { name: 'sample-proof.pdf', type: 'application/pdf', size: pdf.length };
const event = (path, body, changes = {}) => ({
  rawPath: path,
  headers: { origin: 'http://localhost:5173', 'content-type': 'application/json' },
  body: JSON.stringify(body),
  requestContext: { requestId: 'request-1', http: { method: 'POST', sourceIp: '127.0.0.1' } },
  ...changes,
});
function setup() {
  let time = Date.parse('2026-10-28T12:00:00Z');
  const dependencies = localDependencies({ now: () => time });
  const logs = [];
  dependencies.logger = Object.fromEntries(
    ['info', 'warn', 'error'].map((key) => [key, (value) => logs.push(value)]),
  );
  const handler = createHandler(dependencies);
  const registration = registrationFixture();
  let proof = { ...metadata };
  const prepare = (changes = {}) =>
    handler(event('/registrations/uploads', { submissionId, registration, proof, ...changes }));
  const submit = (changes = {}) =>
    handler(event('/registrations', { submissionId, registration, proof, ...changes }));
  async function upload(bytes = pdf) {
    proof = { ...metadata, size: bytes.length };
    const prepared = await prepare();
    assert.equal(prepared.statusCode, 201);
    const ticket = JSON.parse(prepared.body);
    const form = new FormData();
    for (const [key, value] of Object.entries(ticket.upload.fields)) form.append(key, value);
    form.append('file', new Blob([bytes], { type: proof.type }), proof.name);
    await dependencies.acceptUpload(submissionId, form);
    return { ticket, form };
  }
  return {
    dependencies,
    handler,
    logs,
    registration,
    prepare,
    submit,
    upload,
    advance: (ms) => {
      time += ms;
    },
  };
}

test('emails all application fields and both attachments without a database', async () => {
  const h = setup();
  h.registration.signatureDataUrl = `data:image/png;base64,${pngBase64}`;
  h.registration.recipient = 'attacker@example.com';
  await h.upload();
  const result = await h.submit({ toEmail: 'attacker@example.com' });
  assert.equal(result.statusCode, 202);
  assert.equal(JSON.parse(result.body).reference, 'PC-C7E814CF1436');
  const message = h.dependencies.messages[0];
  assert.deepEqual(message.Destination.ToAddresses, ['imfahim003@gmail.com']);
  assert.deepEqual(message.ReplyToAddresses, ['applicant@example.com']);
  for (const value of Object.values(h.registration.values))
    assert.ok(message.Content.Simple.Body.Text.Data.includes(value), `Missing ${value}`);
  assert.deepEqual(message.Content.Simple.Attachments[0].RawContent, pdf);
  assert.deepEqual(
    message.Content.Simple.Attachments[1].RawContent,
    Buffer.from(pngBase64, 'base64'),
  );
  assert.equal(h.dependencies.files.size, 0);
  assert.equal(h.dependencies.store, undefined);
  assert.ok(
    h.logs.every(
      (value) => !value.includes('applicant@example.com') && !value.includes('Sample Person'),
    ),
  );
});

test('does not send again when a consumed document is submitted without a new upload', async () => {
  const h = setup();
  await h.upload();
  await h.submit();
  const response = await h.submit();
  assert.equal(response.statusCode, 409);
  assert.equal(JSON.parse(response.body).error.code, 'DELIVERY_UNCONFIRMED');
  assert.equal(h.dependencies.messages.length, 1);
});

test('rejects required fields, missing consent, future dates and email header injection before issuing an upload', async () => {
  for (const mutate of [
    (r) => {
      r.values.businessName = '';
    },
    (r) => {
      r.declarationAccepted = false;
    },
    (r) => {
      r.values.email = 'person@example.com\r\nBcc:other@example.com';
    },
    (r) => {
      r.values.signatoryDate = '2099-01-01';
    },
    (r) => {
      r.values.guarantorBirth = '2026-02-30';
    },
    (r) => {
      r.values.ref2OtherCountry = '';
    },
    (r) => {
      r.signatureDataUrl = 'data:image/png;base64,YWJj';
    },
  ]) {
    const h = setup();
    mutate(h.registration);
    assert.equal((await h.prepare()).statusCode, 400);
  }
});

test('ignores inactive delivery and guarantor fields and unknown browser properties', () => {
  const input = registrationFixture();
  input.differentDelivery = false;
  input.includeGuarantor = false;
  input.values.guarantorEmail = 'invalid';
  input.values.admin = true;
  const result = validateRegistration(input);
  assert.equal(result.values.guarantorEmail, undefined);
  assert.equal(result.values.deliveryAddress, undefined);
  assert.equal(result.values.admin, undefined);
});

test('rejects oversized, empty, incorrectly typed and unsafe proof metadata', async () => {
  for (const proof of [
    { ...metadata, size: MAX_FILE_BYTES + 1 },
    { ...metadata, size: 0 },
    { ...metadata, name: 'evil.exe' },
    { ...metadata, type: 'image/png' },
    { ...metadata, name: '../proof.pdf' },
  ]) {
    const h = setup();
    assert.equal((await h.prepare({ proof })).statusCode, 400);
  }
});

test('supports a full 5 MB document outside the Lambda JSON request', async () => {
  const h = setup();
  const bytes = Buffer.alloc(MAX_FILE_BYTES, 32);
  bytes.write('%PDF-1.7');
  bytes.write('%%EOF', bytes.length - 5);
  await h.upload(bytes);
  assert.equal((await h.submit()).statusCode, 202);
  assert.equal(
    h.dependencies.messages[0].Content.Simple.Attachments[0].RawContent.length,
    MAX_FILE_BYTES,
  );
});

test('rejects forged file bytes and missing documents without sending', async () => {
  const h = setup();
  assert.equal((await h.submit()).statusCode, 409);
  await h.upload(Buffer.alloc(pdf.length, 'x'));
  assert.equal((await h.submit()).statusCode, 400);
  assert.equal(h.dependencies.messages.length, 0);
});

test('escapes user HTML in the email body', async () => {
  const h = setup();
  h.registration.values.businessName = '<img src=x onerror=alert(1)>';
  await h.upload();
  await h.submit();
  const html = h.dependencies.messages[0].Content.Simple.Body.Html.Data;
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('<img src=x'));
});

test('binds the document to the same application and checks the signed expiry', async () => {
  const h = setup();
  await h.upload();
  const changed = registrationFixture();
  changed.values.email = 'different@example.com';
  assert.equal(
    JSON.parse((await h.submit({ registration: changed })).body).error.code,
    'SUBMISSION_CHANGED',
  );
  h.advance(16 * 60 * 1000);
  assert.equal((await h.submit()).statusCode, 410);
  assert.equal(h.dependencies.messages.length, 0);
});

test('does not trust tampered signed upload fields', async () => {
  const h = setup();
  const { form } = await h.upload();
  form.set('x-amz-meta-application-hash', 'tampered');
  await assert.rejects(
    () => h.dependencies.acceptUpload(submissionId, form),
    (error) => error.status === 403,
  );
});

test('reports known SES rejection separately from an uncertain send without automatically retrying', async () => {
  for (const [name, code] of [
    ['MessageRejected', 'EMAIL_UNAVAILABLE'],
    ['TimeoutError', 'DELIVERY_UNCONFIRMED'],
  ]) {
    const h = setup();
    let calls = 0;
    h.dependencies.mailer.send = async () => {
      calls++;
      const error = new Error('private provider error');
      error.name = name;
      throw error;
    };
    await h.upload();
    const response = await h.submit();
    assert.equal(JSON.parse(response.body).error.code, code);
    assert.ok(!response.body.includes('private provider error'));
    assert.equal(calls, 1);
  }
});

test('returns success after email acceptance even if temporary cleanup fails', async () => {
  const h = setup();
  h.dependencies.uploads.remove = async () => {
    throw new Error();
  };
  await h.upload();
  assert.equal((await h.submit()).statusCode, 202);
  assert.equal(h.dependencies.messages.length, 1);
  assert.ok(h.logs.some((value) => value.includes('upload_cleanup_deferred')));
});

test('checks origin, method, JSON type, request size and honeypot', async () => {
  const h = setup();
  assert.equal(
    (await h.handler(event('/registrations', {}, { headers: { origin: 'https://evil.example' } })))
      .statusCode,
    403,
  );
  assert.equal(
    (await h.handler(event('/registrations', {}, { requestContext: { http: { method: 'GET' } } })))
      .statusCode,
    405,
  );
  assert.equal(
    (
      await h.handler(
        event(
          '/registrations',
          {},
          { headers: { origin: 'http://localhost:5173', 'content-type': 'text/plain' } },
        ),
      )
    ).statusCode,
    415,
  );
  assert.equal((await h.handler(event('/registrations', {}, { body: 'invalid' }))).statusCode, 400);
  assert.equal(
    (await h.handler(event('/registrations', {}, { body: 'a'.repeat(700000) }))).statusCode,
    413,
  );
  assert.equal((await h.prepare({ websiteTrap: 'spam' })).statusCode, 400);
  const result = await h.handler(
    event('/registrations', {}, { requestContext: { http: { method: 'OPTIONS' } } }),
  );
  assert.equal(result.headers['access-control-allow-origin'], 'http://localhost:5173');
});
