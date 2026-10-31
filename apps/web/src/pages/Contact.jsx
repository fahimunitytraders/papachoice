import { localAsset } from '@papas-choice/content';
import { useContent } from '../context/ContentContext.jsx';
import Reveal from '../components/Reveal.jsx';
import Icon from '../components/Icon.jsx';
export default function Contact() {
  const {
    content: { contact: c },
  } = useContent();
  return (
    <div className="contact-deck">
      <section className="contact-panel warehouse-panel" aria-labelledby="warehouse-heading">
        <div className="container">
          <Reveal className="contact-panel-heading">
            <p className="eyebrow">COME SAY HELLO</p>
            <h1 id="warehouse-heading">
              Two locations.
              <br />
              One warm welcome.
            </h1>
          </Reveal>
          <div className="warehouse-grid">
            {c.warehouses.map((warehouse, index) => (
              <Reveal className="warehouse-card" delay={index * 100} key={warehouse.name}>
                <img
                  src={localAsset(warehouse.image)}
                  alt={warehouse.alt}
                  width="1280"
                  height="960"
                />
                <div className="warehouse-details">
                  <h2>{warehouse.name}</h2>
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
            className="contact-next"
            aria-label="Go to phone and WhatsApp"
            onClick={() =>
              document
                .getElementById('contact-team')
                ?.scrollIntoView({
                  behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    ? 'instant'
                    : 'smooth',
                  block: 'start',
                })
            }
          >
            <span>LET’S TALK</span>
            <Icon name="arrow" size={22} />
          </button>
        </div>
      </section>
      <section
        id="contact-team"
        className="contact-panel contact-team-panel"
        aria-labelledby="contact-team-heading"
      >
        <Reveal className="container contact-team-content">
          <p className="eyebrow">A GOOD CONVERSATION STARTS HERE</p>
          <h2 id="contact-team-heading">Let’s talk.</h2>
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
