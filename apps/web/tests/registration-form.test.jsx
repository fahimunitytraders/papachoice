import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import RegistrationForm from '../src/components/RegistrationForm.jsx';
import { registrationFixture, pngBase64 } from '../../api/tests/fixtures.js';

async function finishForm(send) {
  const user = userEvent.setup();
  const done = vi.fn();
  const view = render(<RegistrationForm onDone={done} sendRegistration={send} />);
  const values = registrationFixture().values;
  function fillVisible() {
    for (const field of view.container.querySelectorAll('input[name]')) {
      if (values[field.name]) fireEvent.change(field, { target: { value: values[field.name] } });
    }
  }
  fillVisible();
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  fillVisible();
  await user.selectOptions(screen.getByLabelText(/Forklift on site/), 'No');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  fillVisible();
  await user.upload(
    screen.getByLabelText(/Proof of business address/),
    new File(['%PDF-1.4\n%%EOF'], 'proof.pdf', { type: 'application/pdf' }),
  );
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  fillVisible();
  await user.click(screen.getByRole('checkbox', { name: /I confirm that the information/ }));
  return { user, done };
}
const receipt = { ok: true, mode: 'email', reference: 'PC-TEST123' };
describe('registration submission states', () => {
  it('waits for the server and disables repeated submits and navigation while sending', async () => {
    let resolve;
    const send = vi.fn(
      () =>
        new Promise((complete) => {
          resolve = complete;
        }),
    );
    const { user, done } = await finishForm(send);
    await user.click(screen.getByRole('button', { name: 'Submit application' }));
    expect(screen.getByRole('button', { name: 'Submitting…' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Back' }).disabled).toBe(true);
    expect(done).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Submitting…' }));
    expect(send).toHaveBeenCalledOnce();
    await act(async () => resolve(receipt));
    expect(done).toHaveBeenCalledWith(receipt);
  });
  it('preserves the draft after a failure and retries with the same submission ID', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error('Connection lost. Please try again.'))
      .mockResolvedValueOnce(receipt);
    const { user, done } = await finishForm(send);
    await user.click(screen.getByRole('button', { name: 'Submit application' }));
    expect(screen.getByRole('alert').textContent).toContain('Connection lost');
    expect(screen.getByLabelText(/Typed signature/).value).toBe('Sample Person');
    expect(done).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Submit application' }));
    await waitFor(() => expect(done).toHaveBeenCalledWith(receipt));
    expect(send.mock.calls[0][0].submissionId).toBe(send.mock.calls[1][0].submissionId);
    expect(localStorage.length).toBe(0);
  });
  it('holds an uncertain email result for staff review instead of resending', async () => {
    const error = Object.assign(new Error('Please contact us with PC-TEST123.'), {
      code: 'DELIVERY_UNCONFIRMED',
    });
    const send = vi.fn().mockRejectedValue(error);
    const { user, done } = await finishForm(send);
    await user.click(screen.getByRole('button', { name: 'Submit application' }));
    expect(screen.getByRole('button', { name: 'Submit application' }).disabled).toBe(true);
    expect(
      screen.getByRole('link', { name: 'Contact our team about this application' }),
    ).toBeTruthy();
    expect(done).not.toHaveBeenCalled();
  });
  it('captures the drawn PNG and preserves it when revisiting the references step', async () => {
    const send = vi.fn().mockResolvedValue(receipt);
    const { user } = await finishForm(send);
    const canvas = screen.getByLabelText(/Signature drawing area/);
    const context = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
    };
    canvas.getContext = () => context;
    canvas.setPointerCapture = vi.fn();
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 180 });
    canvas.toDataURL = () => `data:image/png;base64,${pngBase64}`;
    await user.clear(screen.getByLabelText(/Typed signature/));
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 60, clientY: 30 });
    fireEvent.pointerUp(canvas);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Submit application' }));
    expect(send.mock.calls[0][0].registration.signatureDataUrl).toBe(
      `data:image/png;base64,${pngBase64}`,
    );
    expect(send.mock.calls[0][0].registration.values.typedSignature).toBe('');
  });
});
