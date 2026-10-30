import { Link } from 'react-router-dom';
import { localAsset } from '@papas-choice/content';
import { useContent } from '../context/ContentContext.jsx';
import Icon from './Icon.jsx';
export default function Footer({ onInfo }) {
  const { content: c } = useContent();
  const phone = c.contact.phone.replace(/[^+\d]/g, '');
  const whatsapp = c.contact.whatsapp.replace(/\D/g, '');
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="brand-link">
              <img src={localAsset(c.brand.logo)} alt="" />
              <span>{c.brand.name}</span>
            </Link>
            <p>{c.footer.description}</p>
            <p className="footer-tagline">{c.brand.tagline}</p>
          </div>
          <div>
            <h2>{c.footer.contactHeading}</h2>
            <a href={`tel:${phone}`}>{c.contact.phone}</a>
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
              WhatsApp {c.contact.whatsapp}
              <Icon name="arrow" size={13} />
            </a>
            <Link className="footer-address" to="/contact">
              {c.contact.address}
            </Link>
            {c.contact.email && <a href={`mailto:${c.contact.email}`}>{c.contact.email}</a>}
          </div>
          <nav aria-label="Footer navigation">
            <h2>{c.footer.linksHeading}</h2>
            {[
              ['/', 'Home'],
              ['/about', 'About us'],
              ['/products', 'Products'],
              ['/partners', 'Partners'],
              ['/careers', 'Careers'],
              ['/register', c.navigation.register],
              ['/contact', 'Contact us'],
            ].map(([path, label]) => (
              <Link key={path} to={path}>
                {label}
              </Link>
            ))}
          </nav>
          <div>
            <h2>{c.footer.hoursHeading}</h2>
            <p>
              {c.contact.hours}
              <br />
              {c.contact.sunday}
            </p>
            <Link to="/contact" className="text-link">
              Plan your visit
              <Icon name="arrow" size={15} />
            </Link>
            <p className="small muted">{c.footer.note}</p>
          </div>
        </div>
        {(c.contact.legalName || c.contact.companyNumber || c.contact.vatNumber) && (
          <div className="company-details">
            {c.contact.legalName && <span>{c.contact.legalName}</span>}
            {c.contact.companyNumber && <span>Company no. {c.contact.companyNumber}</span>}
            {c.contact.vatNumber && <span>VAT no. {c.contact.vatNumber}</span>}
          </div>
        )}
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {c.footer.copyright}
          </span>
          <div>
            <button onClick={() => onInfo('privacy')}>Privacy & cookies</button>
            <button onClick={() => onInfo('website')}>Website information</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
