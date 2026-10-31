import { useRef } from 'react';
import { localAsset } from '@papas-choice/content';
import { useContent } from '../context/ContentContext.jsx';
import Reveal from '../components/Reveal.jsx';
import Icon from '../components/Icon.jsx';
export default function Contact() {
  const branches = useRef(null);
  const team = useRef(null);
  function scrollToSection(target) {
    target.current?.querySelector('[tabindex="-1"]')?.focus({ preventScroll: true });
    target.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    });
  }
  const {
    content: { contact: c },
  } = useContent();
  return (
    <div className="contact-page">
      <section
        id="contact-branches"
        className="contact-panel warehouse-panel combined-branches"
        aria-label="Find us"
        ref={branches}
      >
        <div className="container">
          <div className="branch-pair">
            {c.warehouses.map((warehouse, index) => (
              <Reveal key={warehouse.name} className="warehouse-card">
                <img
                  src={localAsset(warehouse.image)}
                  alt={warehouse.alt}
                  width="1280"
                  height="960"
                />
                <div className="warehouse-details">
                  <h2 id={`branch-heading-${index}`} tabIndex={-1}>
                    {warehouse.name}
                  </h2>
                  <ul>
                    <li>
                      <address>{warehouse.address}</address>
                    </li>
                    <li>
                      {warehouse.hours || 'Contact us to confirm opening times.'}
                      {index === 0 && <span className="warehouse-sunday">{c.sunday}</span>}
                    </li>
                    <li>Free parking</li>
                    <li>Cash and carry {warehouse.cashAndCarry ? 'available' : 'not available'}</li>
                  </ul>
                  <a
                    className="text-link"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(warehouse.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Get directions to ${warehouse.name}`}
                  >
                    Get directions
                    <Icon name="arrow" />
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
          <button
            type="button"
            className="contact-next"
            onClick={() => scrollToSection(team)}
            aria-controls="contact-team"
          >
            <span>Talk to us</span>
            <Icon name="arrow" size={26} />
          </button>
        </div>
      </section>
      <section
        id="contact-team"
        className="contact-panel contact-team-panel"
        aria-labelledby="contact-team-heading"
        ref={team}
      >
        <button
          type="button"
          className="contact-next contact-back"
          onClick={() => scrollToSection(branches)}
          aria-label="Find us"
          aria-controls="contact-branches"
        >
          <span>FIND US</span>
          <Icon name="arrow" size={26} />
        </button>
        <Reveal className="container contact-team-content">
          <p className="eyebrow">A GOOD CONVERSATION STARTS HERE</p>
          <h2 id="contact-team-heading" tabIndex={-1}>
            Let’s talk.
          </h2>
          <p>Questions about our products or planning a visit? We’re here to help.</p>
          <a className="contact-team-phone" href={`tel:${c.phone.replace(/[^+\d]/g, '')}`}>
            {c.phone}
          </a>
          <a
            className="button"
            href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
          >
            Message on WhatsApp
            <Icon name="arrow" />
          </a>
          {c.email && (
            <a className="text-link" href={`mailto:${c.email}`}>
              {c.email}
            </a>
          )}
        </Reveal>
      </section>
    </div>
  );
}
