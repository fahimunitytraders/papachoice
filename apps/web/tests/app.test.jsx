import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ContentProvider, STORAGE_KEY } from '../src/context/ContentContext.jsx';
import App from '../src/App.jsx';
import RegistrationForm from '../src/components/RegistrationForm.jsx';
import { submitRegistration } from '../src/api/registration.js';
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
    mount('/about');
    expect(screen.getByRole('heading', { name: 'Welcome to Papa’s Choice' })).toBeTruthy();
    expect(screen.getByText('Food that feels like home')).toBeTruthy();
    expect(screen.getByText('02 / QUALITY')).toBeTruthy();
    expect(screen.getByText('03 / OUR VALUES')).toBeTruthy();
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
describe('local content editor', () => {
  it('can enter and clear a price on an imported product', async () => {
    const user = userEvent.setup();
    mount('/admin');
    await user.click(await screen.findByRole('button', { name: 'Products', exact: true }));
    await user.click(screen.getByText('Honey Beans', { selector: 'summary' }));
    const field = screen.getByRole('spinbutton', { name: 'Product 4: Price', exact: true });
    expect(field.value).toBe('');
    await user.type(field, '4.99');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).products[3].price).toBe(4.99);
    await user.clear(field);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).products[3].price).toBeNull();
  });
  it('saves a hex colour, persists it, and blocks invalid values', async () => {
    const user = userEvent.setup();
    mount('/admin');
    const field = await screen.findByRole('textbox', { name: 'Accent hex' });
    await user.clear(field);
    await user.type(field, '#AABBCC');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).theme.accent).toBe('#AABBCC');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#AABBCC');
    await user.clear(field);
    await user.type(field, 'bad');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('alert').textContent).toContain('hex colour');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).theme.accent).toBe('#AABBCC');
  });
  it('edits a homepage button and sees the change on the public page', async () => {
    const user = userEvent.setup();
    mount('/admin');
    await screen.findByRole('heading', { name: 'Site editor' });
    await user.click(screen.getByRole('button', { name: 'Page text' }));
    await user.click(screen.getByText('Home', { selector: 'summary' }));
    const field = screen.getByRole('textbox', { name: 'Home: Primary Button' });
    await user.clear(field);
    await user.type(field, 'Browse our food');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await user.click(screen.getByRole('link', { name: "Papa's Choice home" }));
    expect(await screen.findByRole('link', { name: 'Browse our food' })).toBeTruthy();
  });
  it('ignores corrupt stored content instead of crashing', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid');
    mount();
    expect(screen.getByRole('heading', { name: 'Best sellers' })).toBeTruthy();
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
