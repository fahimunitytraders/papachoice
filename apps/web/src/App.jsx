import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
    const pagePath = location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
    document.title = `${{ '/': 'African wholesale in London', '/about': 'About us', '/products': 'Products', '/partners': 'Our partners', '/careers': 'Careers', '/register': 'Register', '/contact': 'Contact us' }[pagePath] || 'Page not found'} | ${c.brand.name}`;
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
          <Route
            path="*"
            element={
              <section className="container page-section empty-state">
                <p className="eyebrow">404</p>
                <h1>Page not found</h1>
                <p>The page you’re looking for does not exist.</p>
                <Link className="button" to="/">
                  Back to home
                </Link>
              </section>
            }
          />
        </Routes>
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
                {modal.product.price === null
                  ? modal.product.size
                  : `${c.catalogue.priceLabel} · ${modal.product.priceBasis} · ${modal.product.size}`}
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
          <ApplicationForm />
        </Modal>
      )}
      {modal?.type === 'privacy' && (
        <Modal title="Privacy & cookies" onClose={close}>
          <div className="info-copy">
            <p>
              Registration details and supporting documents are emailed to our team for review.
              Career application previews are not submitted or saved.
            </p>
            <p>
              No analytics or advertising cookies are installed. Fonts are requested from Google
              Fonts. Links to WhatsApp, Maps and partner sites open external services with their own
              privacy practices.
            </p>
            <p>For questions about your information, call {c.contact.phone}.</p>
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
              Register online to send your business details for review. For career enquiries or help
              using this website, call {c.contact.phone}.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
