import { it, expect, vi, afterEach } from 'vitest';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});
it('encodes a PDF and posts the backend contract to the configured URL', async () => {
  vi.stubEnv('VITE_CAREERS_LAMBDA_URL', 'https://example.com/careers');
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  vi.stubGlobal('fetch', fetch);
  const { submitApplication } = await import('../src/api/careers.js');
  const fields = { jobId: 'credit-controller', name: 'Applicant', consent: true };
  await submitApplication(fields, new File(['%PDF-1.7'], 'cv.pdf', { type: 'application/pdf' }));
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe('https://example.com/careers');
  expect(JSON.parse(options.body)).toEqual({
    fields,
    attachment: { name: 'cv.pdf', contentBase64: btoa('%PDF-1.7') },
  });
});
it('rejects an HTTP error and does not report success', async () => {
  vi.stubEnv('VITE_CAREERS_LAMBDA_URL', 'https://example.com/careers');
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, message: 'Unable to send.' }),
      }),
  );
  const { submitApplication } = await import('../src/api/careers.js');
  await expect(
    submitApplication({}, new File(['%PDF-1.7'], 'cv.pdf', { type: 'application/pdf' })),
  ).rejects.toThrow('Unable to send.');
});
it('fails safely without an endpoint', async () => {
  vi.stubEnv('VITE_CAREERS_LAMBDA_URL', '');
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const { submitApplication } = await import('../src/api/careers.js');
  await expect(submitApplication({}, null)).rejects.toThrow('temporarily unavailable');
  expect(fetch).not.toHaveBeenCalled();
});
