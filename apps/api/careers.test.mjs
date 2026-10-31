import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { handler } from './index.mjs';
const originalFetch = globalThis.fetch;
const names = [
  'GMAIL_CLIENT_ID',
  'GMAIL_CLIENT_SECRET',
  'GMAIL_REFRESH_TOKEN',
  'GMAIL_FROM',
  'GMAIL_TO',
  'GMAIL_CAREERS_TO',
];
const original = Object.fromEntries(names.map((k) => [k, process.env[k]]));
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const k of names) {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  }
});
function configured() {
  for (const k of names) process.env[k] = 'fixture';
}
function event(change = {}) {
  return {
    requestContext: { http: { method: 'POST' } },
    body: JSON.stringify({
      type: 'careers',
      fields: {
        jobId: 'credit-controller',
        name: 'Applicant',
        email: 'applicant@example.com',
        message: 'Relevant experience',
        consent: true,
        ...change,
      },
      attachment: { name: 'cv.pdf', contentBase64: Buffer.from('%PDF-1.7\nCV').toString('base64') },
    }),
  };
}
test('sends the selected role, applicant details and CV via Gmail', async () => {
  configured();
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () =>
        url.includes('oauth2') ? { access_token: 'fixture-token' } : { id: 'message-id' },
    };
  };
  const response = await handler(event());
  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).success, true);
  assert.equal(calls.length, 2);
  const mime = Buffer.from(JSON.parse(calls[1].options.body).raw, 'base64url').toString();
  assert.match(mime, /filename="document.pdf"/);
  assert.ok(
    mime.includes(
      Buffer.from(
        'Role: Credit Controller\nName: Applicant\nEmail: applicant@example.com\nPhone: Not provided\n\nRelevant experience\n\nApplicant consent: accepted',
      )
        .toString('base64')
        .slice(0, 60),
    ),
  );
});
test('rejects invalid role, email and missing consent without sending', async () => {
  configured();
  globalThis.fetch = () => assert.fail('Must not send');
  for (const change of [{ jobId: 'unknown' }, { email: 'invalid' }, { consent: false }])
    assert.equal((await handler(event(change))).statusCode, 400);
});
test('rejects invalid PDF content', async () => {
  configured();
  const e = event();
  const p = JSON.parse(e.body);
  p.attachment.contentBase64 = Buffer.from('not a pdf').toString('base64');
  e.body = JSON.stringify(p);
  assert.equal((await handler(e)).statusCode, 400);
});
test('reports Gmail failures without claiming success', async () => {
  configured();
  globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
  assert.equal((await handler(event())).statusCode, 502);
});
test('requires configuration and POST', async () => {
  delete process.env.GMAIL_CLIENT_SECRET;
  assert.equal((await handler(event())).statusCode, 500);
  assert.equal((await handler({ requestContext: { http: { method: 'GET' } } })).statusCode, 405);
});

test('registration still sends with legacy attachment and frontend proofFile formats', async () => {
  configured();
  const messages = [];
  globalThis.fetch = async (url, options) => {
    if (url.includes('oauth2'))
      return { ok: true, json: async () => ({ access_token: 'fixture' }) };
    messages.push(Buffer.from(JSON.parse(options.body).raw, 'base64url').toString());
    return { ok: true, json: async () => ({ id: 'sent' }) };
  };
  const fields = {
    contactName: 'Customer',
    businessName: 'Business',
    email: 'customer@example.com',
    mobile: '123',
    accountAddress: 'Street',
    accountCity: 'London',
    accountPostcode: 'E1',
    declarationAccepted: true,
  };
  const content = Buffer.from('%PDF-1.7\nProof').toString('base64');
  for (const file of [
    { attachment: { name: 'proof.pdf', contentBase64: content } },
    { proofFile: { filename: 'proof.pdf', base64: content, mimeType: 'application/pdf' } },
  ]) {
    const response = await handler({
      requestContext: { http: { method: 'POST' } },
      body: JSON.stringify({ fields, ...file }),
    });
    assert.equal(response.statusCode, 200);
  }
  assert.equal(messages.length, 2);
  for (const mime of messages) {
    assert.ok(mime.includes(Buffer.from('PapaChoice registration: Business').toString('base64')));
    assert.match(mime, /filename="document.pdf"/);
  }
});
test('rejects invalid registration and unknown submission types without sending', async () => {
  configured();
  globalThis.fetch = () => assert.fail('Must not send');
  for (const payload of [{ type: 'unknown', fields: {} }, { fields: { email: 'bad' } }]) {
    assert.equal(
      (
        await handler({
          requestContext: { http: { method: 'POST' } },
          body: JSON.stringify(payload),
        })
      ).statusCode,
      400,
    );
  }
});
