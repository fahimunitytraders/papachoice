import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ContentProvider } from '../src/context/ContentContext.jsx';
import { submitApplication } from '../src/api/careers.js';
import App from '../src/App.jsx';
import RegistrationForm from '../src/components/RegistrationForm.jsx';
import { submitRegistration } from '../src/api/registration.js';
vi.mock('../src/api/careers.js', () => ({ submitApplication: vi.fn() }));
vi.mock('../src/api/registration.js', () => ({ submitRegistration: vi.fn() }));
function mount(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ContentProvider>
        <App />
      </ContentProvider>
    </MemoryRouter>,
  );
}
describe('Papa’s Choice catalogue', () => {
  it('shows branding, best sellers, prices and brands without shopping controls', () => {
    mount();
    expect(screen.getByRole('heading', { name: 'Best sellers' })).toBeTruthy();
    expect(screen.getByRole('link', { name: "Papa's Choice home" })).toBeTruthy();
    expect(screen.getByText('£9.99')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /basket|quantity|colour/i })).toBeNull();
    expect(screen.getAllByText("Papa's Choice").length).toBeGreaterThan(2);
  });
  it('filters products and gives enquiry links instead of checkout', async () => {
    const user = userEvent.setup();
    mount('/products');
    await user.click(screen.getByRole('button', { name: 'Seasonings' }));
    expect(screen.getAllByRole('button', { name: 'View product' })).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'View Pepper Soup Mix' }));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('link', { name: 'Enquire on WhatsApp' }).getAttribute('href'),
    ).toContain('447398477274');
    expect(within(dialog).queryByRole('spinbutton')).toBeNull();
    await user.click(within(dialog).getByRole('button', { name: 'Close dialog' }));
    await user.type(screen.getByRole('textbox', { name: 'Search catalogue' }), 'missing');
    expect(screen.getByText('No products found')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getAllByRole('button', { name: 'View product' })).toHaveLength(73);
  });
  it('shows imported products with local pictures, descriptions and enquiry pricing', async () => {
    const user = userEvent.setup();
    mount('/products?category=Beans+%26+peas&q=honey');
    expect(screen.getByText('1 product')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Honey Beans' }).getAttribute('src')).toContain(
      '/assets/products/honey-beans.jpg',
    );
    expect(screen.getByText('Price on enquiry')).toBeTruthy();
    expect(screen.queryByText('£0.00')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'View Honey Beans' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Dried honey beans/)).toBeTruthy();
    expect(within(dialog).getByText('Price on enquiry')).toBeTruthy();
    expect(
      within(dialog).getByRole('link', { name: 'Enquire on WhatsApp' }).getAttribute('href'),
    ).toContain('Honey%20Beans');
  });
  it('pauses partner motion and searches the partner directory', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole('button', { name: 'Pause partner animation' }));
    expect(
      screen.getByRole('button', { name: 'Play partner animation' }).getAttribute('aria-pressed'),
    ).toBe('true');
    await user.click(screen.getByRole('link', { name: 'Meet our partners' }));
    await user.type(screen.getByRole('textbox', { name: 'Find a partner' }), 'Rajah');
    expect(screen.getByText('1 partners')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Rajah' })).toBeTruthy();
  });
  it('shows all three illustrated About sections and contact details', () => {
    const { container } = mount('/about');
    expect(screen.getByRole('heading', { name: 'Welcome to Papa’s Choice' })).toBeTruthy();
    expect(screen.queryByText('Food that feels like home')).toBeNull();
    expect(screen.queryByText('02 / QUALITY')).toBeNull();
    expect(screen.queryByText('03 / OUR VALUES')).toBeNull();
    expect(container.querySelector('.chapter-number')).toBeNull();
    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getByRole('link', { name: '+44 20 4618 8640' }).getAttribute('href')).toBe(
      'tel:+442046188640',
    );
  });
  it('retains the two roles without salary and opens an application', async () => {
    const user = userEvent.setup();
    mount('/careers');
    expect(screen.getByRole('heading', { name: 'Warehouse Operative' })).toBeTruthy();
    expect(screen.queryByText(/salary|per annum|£\d/)).toBeNull();
    await user.click(screen.getByRole('button', { name: /Finance Credit Controller/ }));
    await user.click(screen.getByRole('button', { name: 'Apply for this role' }));
    expect(screen.getByRole('dialog', { name: 'Apply: Credit Controller' })).toBeTruthy();
  });
  it('register is a separate page', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getAllByRole('link', { name: 'Register' })[0]);
    expect(screen.getByRole('heading', { name: 'Let’s talk trade.' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
describe('admin removal', () => {
  it('shows a not found page for the former admin route without an editor link', () => {
    mount('/admin');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Site editor' })).toBeNull();
  });
  it('uses published content even when legacy editor settings exist', () => {
    localStorage.setItem(
      'papas-choice-content-v1',
      JSON.stringify({ theme: { accent: '#AABBCC' } }),
    );
    mount();
    expect(screen.getByRole('heading', { name: 'Best sellers' })).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue('--accent')).not.toBe('#AABBCC');
  });
});
describe('registration', () => {
  it('completes all steps without storing personal information', async () => {
    const user = userEvent.setup();
    const done = vi.fn();
    vi.mocked(submitRegistration).mockResolvedValue({ success: true });
    render(<RegistrationForm onDone={done} />);
    const fill = async (label, value) => user.type(screen.getByLabelText(label), value);
    await fill(/Contact full name/, 'Sample Person');
    await fill(/Business \/ applicant name/, 'Sample Business');
    await fill(/Email address/, 'test@example.com');
    await fill(/Mobile number/, '07000000000');
    await fill(/Street address/, '1 Sample Street');
    await fill(/Town \/ city/, 'London');
    await fill(/Postcode/, 'SW1A 1AA');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await fill(/Parking \/ unloading access/, 'Loading bay');
    await user.selectOptions(screen.getByLabelText(/Forklift on site/), 'No');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    for (const label of [
      /Contact person/,
      /Supplier business name/,
      /Street address/,
      /Town \/ city/,
      /Postcode/,
    ])
      for (const input of screen.getAllByLabelText(label)) await user.type(input, 'Sample');
    await user.upload(
      screen.getByLabelText(/Proof of business address/),
      new File(['sample'], 'sample.pdf', { type: 'application/pdf' }),
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await fill(/Authorised signatory/, 'Sample Person');
    await fill(/Job title \/ position/, 'Director');
    await fill(/Signing date/, '2026-10-28');
    await fill(/Typed signature/, 'Sample Person');
    await user.click(screen.getByRole('checkbox', { name: /I confirm that I am authorised/ }));
    await user.click(screen.getByRole('button', { name: 'Submit registration' }));
    await waitFor(() => expect(done).toHaveBeenCalledOnce());
    expect(submitRegistration).toHaveBeenCalledWith(
      expect.objectContaining({ businessName: 'Sample Business', declarationAccepted: true }),
      expect.any(File),
      null,
    );
    expect(localStorage.length).toBe(0);
  });
});

describe('career applications', () => {
  async function fillApplication() {
    const user = userEvent.setup();
    mount('/careers');
    await user.click(screen.getByRole('button', { name: /Finance Credit Controller/ }));
    await user.click(screen.getByRole('button', { name: 'Apply for this role' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Full name *'), 'Applicant');
    await user.type(dialog.getByLabelText('Email address *'), 'applicant@example.com');
    await user.type(dialog.getByLabelText('A little about you *'), 'My experience');
    await user.upload(
      dialog.getByLabelText('CV *'),
      new File(['%PDF-1.7'], 'cv.pdf', { type: 'application/pdf' }),
    );
    await user.click(dialog.getByRole('checkbox'));
    return { user, dialog };
  }
  it('sends the selected role and CV, then confirms success', async () => {
    vi.mocked(submitApplication).mockResolvedValue({ success: true });
    const { user, dialog } = await fillApplication();
    // jsdom reports valueMissing for uploaded files; dispatch submit after checking the upload.
    expect(dialog.getByLabelText('CV *').files).toHaveLength(1);
    fireEvent.submit(dialog.getByRole('button', { name: 'Submit application' }).closest('form'));
    await screen.findByRole('heading', { name: 'Application submitted' });
    expect(submitApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'credit-controller',
        email: 'applicant@example.com',
        consent: true,
      }),
      expect.any(File),
    );
  });
  it('preserves the form and allows retry when sending fails', async () => {
    vi.mocked(submitApplication).mockRejectedValue(new Error('Unable to send.'));
    const { user, dialog } = await fillApplication();
    // jsdom reports valueMissing for uploaded files; dispatch submit after checking the upload.
    expect(dialog.getByLabelText('CV *').files).toHaveLength(1);
    fireEvent.submit(dialog.getByRole('button', { name: 'Submit application' }).closest('form'));
    expect((await screen.findByRole('alert')).textContent).toContain('Unable to send.');
    expect(dialog.getByLabelText('Full name *').value).toBe('Applicant');
    expect(screen.queryByText('Application submitted')).toBeNull();
  });
});

it('shows both warehouses with their matching photos and directions', () => {
  mount('/contact');
  for (const [name, address, image] of [
    ['London warehouse', '310-326 St James Road, London, SE1 5JX', '/assets/warehouses/london.jpg'],
    [
      'Thrapston warehouse',
      '20 Midland Road, Thrapston, NN14 4JR',
      '/assets/warehouses/thrapston.jpg',
    ],
  ]) {
    const card = screen.getByRole('heading', { name }).closest('.warehouse-card');
    expect(within(card).getByText(address)).toBeTruthy();
    expect(within(card).getByRole('img').getAttribute('src')).toContain(image);
    expect(
      within(card)
        .getByRole('link', { name: `Get directions to ${name}` })
        .getAttribute('href'),
    ).toContain(encodeURIComponent(address));
  }
});
