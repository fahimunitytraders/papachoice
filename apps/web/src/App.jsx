import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { localAsset, money } from '@papas-choice/content';
import { useContent } from './context/ContentContext.jsx';
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import About from './pages/About.jsx';
import Partners from './pages/Partners.jsx';
import Contact from './pages/Contact.jsx';
import Careers from './pages/Careers.jsx';
import Register from './pages/Register.jsx';
import Modal from './components/Modal.jsx';
import ApplicationForm from './components/ApplicationForm.jsx';
import ProductImage from './components/ProductImage.jsx';
import Footer from './components/Footer.jsx';
import Icon from './components/Icon.jsx';
const Admin = lazy(() => import('./pages/Admin.jsx'));
export default function App() {
  const { content: c } = useContent();
  const location = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  useEffect(() => {
    setMenu(false);
    setModal(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = `${{ '/': 'African wholesale in London', '/about': 'About us', '/products': 'Products', '/partners': 'Our partners', '/careers': 'Careers', '/register': 'Register', '/contact': 'Contact us', '/admin': 'Site editor' }[location.pathname] || 'Home'} | ${c.brand.name}`;
  }, [location.pathname, c.brand.name]);
  function searchSubmit(e) {
    e.preventDefault();
    setMenu(false);
    navigate(`/products${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`);
  }
  const nav = [
    ['/', c.navigation.home],
    ['/about', c.navigation.about],
    ['/products', c.navigation.products],
    ['/partners', c.navigation.partners],
    ['/careers', c.navigation.careers],
  ];
  const close = () => setModal(null);
  const onDetails = (product) => setModal({ type: 'product', product });
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand-link" to="/" aria-label={`${c.brand.name} home`}>
            <img src={localAsset(c.brand.logo)} alt="" />
            <span>{c.brand.name}</span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {nav.map(([path, label]) => (
              <NavLink key={path} to={path} end={path === '/'}>
                {label}
              </NavLink>
            ))}
          </nav>
          <form className="search-field header-search" onSubmit={searchSubmit}>
            <Icon name="search" size={17} />
            <input
              aria-label="Search products"
              placeholder={c.navigation.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <Link className="register-link" to="/register">
            <Icon name="user" size={18} />
            {c.navigation.register}
          </Link>
          <button
            className="icon-button menu-toggle"
            aria-label={menu ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menu}
            aria-controls="mobile-nav"
            onClick={() => setMenu(!menu)}
          >
            <Icon name={menu ? 'close' : 'menu'} />
          </button>
        </div>
        {menu && (
          <nav className="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
            {nav.map(([path, label]) => (
              <NavLink key={path} to={path} end={path === '/'}>
                {label}
              </NavLink>
            ))}
            <Link to="/contact">Contact us</Link>
            <form className="search-field" onSubmit={searchSubmit}>
              <Icon name="search" size={18} />
              <input
                aria-label="Search products on mobile"
                placeholder={c.navigation.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="icon-button" aria-label="Submit search">
                <Icon name="arrow" />
              </button>
            </form>
          </nav>
        )}
      </header>
      <main id="main" tabIndex="-1">
        <Suspense fallback={<div className="container page-section">Loading editor…</div>}>
          <Routes>
            <Route path="/" element={<Home onDetails={onDetails} />} />
            <Route path="/products" element={<Products onDetails={onDetails} />} />
            <Route path="/about" element={<About />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/careers"
              element={<Careers onApply={(job) => setModal({ type: 'application', job })} />}
            />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer onInfo={(type) => setModal({ type })} />
      {modal?.type === 'product' && (
        <Modal title={modal.product.name} onClose={close}>
          <div className="product-detail">
            <ProductImage
              src={modal.product.image}
              crop={modal.product.crop}
              label={modal.product.name}
            />
            <p className="eyebrow">
              {modal.product.brand} · {modal.product.sku}
            </p>
            <p>{modal.product.description}</p>
            <div className="detail-price">
              {money(modal.product.price)}
              <span>
<<<<<<< HEAD
                {c.catalogue.priceLabel} · {modal.product.priceBasis} · {modal.product.size}
=======
                {modal.product.price === null
                  ? modal.product.size
                  : `${c.catalogue.priceLabel} · ${modal.product.priceBasis} · ${modal.product.size}`}
>>>>>>> origin/fullprods
              </span>
            </div>
            <p className="price-notice">{c.catalogue.priceNotice}</p>
            <div className="detail-actions">
              <a
                className="button"
                href={`https://wa.me/${c.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, I would like to enquire about ${modal.product.name} (${modal.product.size}), ${modal.product.sku}.`)}`}
                target="_blank"
                rel="noreferrer"
              >
                {c.catalogue.enquiryButton}
                <Icon name="arrow" size={17} />
              </a>
              <a className="text-link" href={`tel:${c.contact.phone.replace(/[^+\d]/g, '')}`}>
                {c.catalogue.callButton}
              </a>
            </div>
          </div>
        </Modal>
      )}
      {modal?.type === 'application' && (
        <Modal title={`Apply: ${modal.job.title}`} onClose={close} wide>
          <ApplicationForm job={modal.job} />
        </Modal>
      )}
      {modal?.type === 'privacy' && (
        <Modal title="Privacy & cookies" onClose={close}>
          <div className="info-copy">
            <p>
<<<<<<< HEAD
              This frontend preview does not send registration or job application details to a
              server. Form entries and selected files stay in memory while the form is open.
=======
              When you submit a registration, your contact and business details, references,
              declaration and supporting document are sent to our team by email. Guarantor details
              and a drawn signature are included if you provide them. Supporting documents use
              private temporary storage and are removed after sending, with automatic expiry for
              abandoned uploads. Temporary document metadata and operational logs help us process
              and troubleshoot submissions. Registration details are not saved in your browser.
              Career applications remain a preview.
>>>>>>> origin/fullprods
            </p>
            <p>
              The site editor stores your content settings in this browser’s local storage. You can
              remove them using Reset to defaults in the editor or your browser’s site data
              settings.
            </p>
            <p>
              No analytics or advertising cookies are installed. Fonts are requested from Google
              Fonts, and custom image URLs entered in the editor may request files from other
              websites. Links to WhatsApp, Maps and partner sites open external services with their
              own privacy practices.
            </p>
            <p>
<<<<<<< HEAD
              For company enquiries, call {c.contact.phone}. A production privacy notice should be
              updated when the backend and data handling are defined.
=======
              For questions about your information or to request a correction, call{' '}
              {c.contact.phone}.
>>>>>>> origin/fullprods
            </p>
          </div>
        </Modal>
      )}
      {modal?.type === 'website' && (
        <Modal title="Website information" onClose={close}>
          <div className="info-copy">
            <p>
              This website is a product catalogue. Online checkout and payment processing are not
              available. Speak to our team to confirm products, pricing, availability and ordering
              arrangements.
            </p>
            <p>{c.catalogue.priceNotice}</p>
            <p>
              Product photography is illustrative. Please check the physical packaging for current
              ingredients, allergens and preparation guidance.
            </p>
            <p>
<<<<<<< HEAD
              Registration and career applications are currently demonstrations. Nothing is
              submitted. For assistance using this website, call {c.contact.phone}.
=======
              Registration applications are emailed to our team for review when online registration
              is available. Career applications are currently demonstrations. For assistance using
              this website, call {c.contact.phone}.
>>>>>>> origin/fullprods
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
