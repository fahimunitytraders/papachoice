import { describe, it, expect, vi } from 'vitest';
import { submitRegistration } from '../src/services/registration.js';
import { registrationFixture, submissionId } from '../../api/tests/fixtures.js';

const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
});
const input = () => ({
  submissionId,
  registration: registrationFixture(),
  proof: new File(['%PDF-1.4\n%%EOF'], 'proof.pdf', { type: 'application/pdf' }),
});
describe('registration transport', () => {
  it('rejects a malformed success receipt', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        response({ upload: { url: 'https://uploads.example.com', fields: {} } }),
      )
      .mockResolvedValueOnce(response({}, 204))
      .mockResolvedValueOnce(response({ ok: true }));
    await expect(
      submitRegistration(input(), { baseUrl: 'https://api.example.com', fetchImpl }),
    ).rejects.toThrow('could not confirm');
  });
  it('uploads the actual document separately, sends all form data and waits for the email receipt', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          upload: {
            url: 'https://uploads.example.com',
            fields: { key: 'proof.pdf', policy: 'signed' },
          },
        }),
      )
      .mockResolvedValueOnce(response({}, 204))
      .mockResolvedValueOnce(response({ ok: true, mode: 'email', reference: 'PC-123' }, 202));
    const data = input();
    const result = await submitRegistration(data, {
      baseUrl: 'https://api.example.com',
      fetchImpl,
    });
    expect(result.reference).toBe('PC-123');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const upload = fetchImpl.mock.calls[1][1];
    expect(upload.body.get('file').name).toBe('proof.pdf');
    expect(upload.headers).toBeUndefined();
    const final = JSON.parse(fetchImpl.mock.calls[2][1].body);
    expect(final.registration.values.guarantorEmail).toBe('guarantor@example.com');
    expect(final.submissionId).toBe(submissionId);
    expect(final.proof.name).toBe('proof.pdf');
    expect(final).not.toHaveProperty('toEmail');
  });
  it('does not show success with no backend configuration', async () => {
    const fetchImpl = vi.fn();
    await expect(submitRegistration(input(), { baseUrl: '', fetchImpl })).rejects.toMatchObject({
      code: 'NOT_CONFIGURED',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('does not submit if uploading the document fails', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        response({ upload: { url: 'https://uploads.example.com', fields: {} } }),
      )
      .mockResolvedValueOnce(response({}, 403));
    await expect(
      submitRegistration(input(), { baseUrl: 'https://api.example.com', fetchImpl }),
    ).rejects.toMatchObject({ code: 'UPLOAD_FAILED' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it('holds an uncertain send for review instead of automatically resending', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          reference: 'PC-123',
          upload: { url: 'https://uploads.example.com', fields: {} },
        }),
      )
      .mockResolvedValueOnce(response({}, 204))
      .mockRejectedValueOnce(new Error('Connection lost'));
    await expect(
      submitRegistration(input(), { baseUrl: 'https://api.example.com', fetchImpl }),
    ).rejects.toMatchObject({ code: 'DELIVERY_UNCONFIRMED' });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
  it('surfaces a send failure and never invents success', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        response({ upload: { url: 'https://uploads.example.com', fields: {} } }),
      )
      .mockResolvedValueOnce(response({}, 204))
      .mockResolvedValueOnce(
        response({ error: { code: 'EMAIL_UNAVAILABLE', message: 'Please try later.' } }, 503),
      );
    await expect(
      submitRegistration(input(), { baseUrl: 'https://api.example.com', fetchImpl }),
    ).rejects.toMatchObject({ code: 'EMAIL_UNAVAILABLE', message: 'Please try later.' });
  });
});
