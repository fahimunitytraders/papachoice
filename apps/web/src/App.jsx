import { text } from '@papas-choice/content';
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
    document.title = `${{ '/': text('App.african_wholesale_in_london'), '/about': text('App.about_us'), '/products': text('App.products'), '/partners': text('App.our_partners'), '/careers': text('App.careers'), '/register': text('App.register'), '/contact': text('App.contact_us') }[pagePath] || text('App.page_not_found')} | ${c.brand.name}`;
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
        {text('App.skip_to_content')}
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand-link" to="/" aria-label={text('App.brand_home', [c.brand.name])}>
            <img src={localAsset(c.brand.logo)} alt="" />
            <span>{c.brand.name}</span>
          </Link>
          <nav className="desktop-nav" aria-label={text('App.main_navigation')}>
            {nav.map(([path, label]) => (
              <NavLink key={path} to={path} end={path === '/'}>
                {label}
              </NavLink>
            ))}
          </nav>
          <form className="search-field header-search" onSubmit={searchSubmit}>
            <Icon name="search" size={17} />
            <input
              aria-label={text('App.search_products')}
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
            aria-label={menu ? text('App.close_navigation') : text('App.open_navigation')}
            aria-expanded={menu}
            aria-controls="mobile-nav"
            onClick={() => setMenu(!menu)}
          >
            <Icon name={menu ? 'close' : 'menu'} />
          </button>
        </div>
        {menu && (
          <nav className="mobile-nav" id="mobile-nav" aria-label={text('App.mobile_navigation')}>
            {nav.map(([path, label]) => (
              <NavLink key={path} to={path} end={path === '/'}>
                {label}
              </NavLink>
            ))}
            <Link to="/contact">{text('App.contact_us')}</Link>
            <form className="search-field" onSubmit={searchSubmit}>
              <Icon name="search" size={18} />
              <input
                aria-label={text('App.search_products_on_mobile')}
                placeholder={c.navigation.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="icon-button" aria-label={text('App.submit_search')}>
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
                <h1>{text('App.page_not_found')}</h1>
                <p>{text('App.the_page_you_re_looking_for_does_not_exist')}</p>
                <Link className="button" to="/">
                  {text('App.back_to_home')}
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
                href={`https://wa.me/${c.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text('App.product_enquiry', [modal.product.name, modal.product.size, modal.product.sku]))}`}
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
        <Modal title={text('App.apply_0', [modal.job.title])} onClose={close} wide>
          <ApplicationForm job={modal.job} />
        </Modal>
      )}
      {modal?.type === 'privacy' && (
        <Modal title={text('App.privacy_cookies')} onClose={close}>
          <div className="info-copy">
            <p>{text('App.registration_details_and_supporting_documents_are_emailed_to_our_')}</p>
            <p>{text('App.no_analytics_or_advertising_cookies_are_installed_fonts_are_reque')}</p>
            <p>
              {text('App.for_questions_about_your_information_call')}
              {c.contact.phone}.
            </p>
          </div>
        </Modal>
      )}
      {modal?.type === 'website' && (
        <Modal title={text('App.website_information')} onClose={close}>
          <div className="info-copy">
            <p>{text('App.this_website_is_a_product_catalogue_online_checkout_and_payment_p')}</p>
            <p>{c.catalogue.priceNotice}</p>
            <p>{text('App.product_photography_is_illustrative_please_check_the_physical_pac')}</p>
            <p>
              {text('App.register_online_to_send_your_business_details_for_review_for_care')}
              {c.contact.phone}.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
