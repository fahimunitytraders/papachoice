import { test } from 'node:test';
import assert from 'node:assert/strict';
import { S3Client } from '@aws-sdk/client-s3';
import { awsDependencies } from '../src/aws.js';

const env = {
  UPLOAD_BUCKET: 'example-test-bucket',
  FROM_EMAIL: 'sender@example.com',
  TO_EMAIL: 'imfahim003@gmail.com',
  ALLOWED_ORIGIN: 'http://localhost:5173',
};
test('signs an upload restricted to its file and application metadata without a database', async () => {
  const s3 = new S3Client({
    region: 'eu-west-2',
    credentials: { accessKeyId: 'TESTONLY', secretAccessKey: 'test-only-not-a-real-key' },
  });
  const deps = awsDependencies(env, { s3, ses: {} });
  assert.equal(deps.store, undefined);
  const ticket = {
    key: 'registrations/test/proof.pdf',
    proof: { type: 'application/pdf', size: 100 },
    fingerprint: 'application-hash',
    createdAt: '2026-10-28T12:00:00Z',
    uploadExpiresAt: 1793189700,
  };
  const upload = await deps.uploads.sign(ticket, 300);
  const policy = JSON.parse(Buffer.from(upload.fields.Policy, 'base64').toString());
  const has = (condition) =>
    policy.conditions.some((value) => JSON.stringify(value) === JSON.stringify(condition));
  assert.ok(has(['content-length-range', 100, 100]));
  assert.ok(policy.conditions.some((value) => value.key === ticket.key));
  assert.ok(has(['eq', '$Content-Type', 'application/pdf']));
  assert.ok(has(['eq', '$x-amz-meta-application-hash', 'application-hash']));
  assert.ok(has(['eq', '$x-amz-meta-expires-at', String(ticket.uploadExpiresAt)]));
  assert.equal(upload.fields['x-amz-server-side-encryption'], 'AES256');
  assert.ok(new Date(policy.expiration).getTime() - Date.now() <= 300000);
});
test('checks S3 metadata before loading an oversized file', async () => {
  let destroyed = false;
  const deps = awsDependencies(env, {
    ses: {},
    s3: {
      async send() {
        return {
          ContentLength: 9000000,
          ContentType: 'application/pdf',
          Body: {
            destroy() {
              destroyed = true;
            },
          },
        };
      },
    },
  });
  await assert.rejects(
    () =>
      deps.uploads.read({
        key: 'registrations/x/proof.pdf',
        proof: { size: 100, type: 'application/pdf' },
      }),
    (error) => error.code === 'UPLOAD_INVALID',
  );
  assert.equal(destroyed, true);
});
test('returns signed S3 application metadata alongside the document', async () => {
  const deps = awsDependencies(env, {
    ses: {},
    s3: {
      async send() {
        return {
          ContentLength: 3,
          ContentType: 'application/pdf',
          Metadata: {
            'application-hash': 'hash',
            'created-at': '2026-10-28T12:00:00Z',
            'expires-at': '1793189700',
          },
          Body: {
            async transformToByteArray() {
              return Buffer.from('pdf');
            },
          },
        };
      },
    },
  });
  const result = await deps.uploads.read({
    key: 'registrations/x/proof.pdf',
    proof: { size: 3, type: 'application/pdf' },
  });
  assert.equal(result.fingerprint, 'hash');
  assert.equal(result.expiresAt, 1793189700);
  assert.equal(result.bytes.toString(), 'pdf');
});
test('sends through SES and returns its receipt', async () => {
  let command;
  const deps = awsDependencies(env, {
    s3: {},
    ses: {
      async send(input) {
        command = input;
        return { MessageId: 'ses-message-id' };
      },
    },
  });
  const message = { Destination: { ToAddresses: ['imfahim003@gmail.com'] } };
  assert.equal(await deps.mailer.send(message), 'ses-message-id');
  assert.equal(command.constructor.name, 'SendEmailCommand');
  assert.deepEqual(command.input, message);
});
