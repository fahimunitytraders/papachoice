import { useEffect, useRef, useState } from 'react';
import { localAsset } from '@papas-choice/content';
import { useContent } from '../context/ContentContext.jsx';
import Reveal from '../components/Reveal.jsx';
import Icon from '../components/Icon.jsx';
export default function Contact() {
  const [section, setSection] = useState(0);
  const deck = useRef(null);
  const switched = useRef(false);
  useEffect(() => {
    if (!switched.current) return;
    const panel = deck.current.querySelector('section[aria-hidden="false"]');
    if (panel) panel.scrollTop = 0;
    deck.current
      .querySelector('section[aria-hidden="false"] [tabindex="-1"]')
      ?.focus({ preventScroll: true });
  }, [section]);
  function showSection(next) {
    switched.current = true;
    setSection(next);
  }
  const {
    content: { contact: c },
  } = useContent();
  return (
    <div className="contact-deck" ref={deck}>
      <div className="contact-panel-track" style={{ transform: `translateY(-${section * 100}%)` }}>
        {c.warehouses.map((warehouse, index) => (
          <section
            key={warehouse.name}
            id={`contact-branch-${index}`}
            className="contact-panel warehouse-panel"
            aria-labelledby={`branch-heading-${index}`}
            aria-hidden={section !== index}
            inert={section !== index}
          >
            {index > 0 && (
              <button
                type="button"
                className="contact-next contact-back"
                onClick={() => showSection(index - 1)}
                aria-controls={`contact-branch-${index - 1}`}
              >
                <Icon name="arrow" size={26} />
                <span>Back to London branch</span>
              </button>
            )}
            <div className="container">
              <Reveal className="contact-panel-heading">
                <p className="eyebrow">COME SAY HELLO</p>
                <h1 id={`branch-heading-${index}`} tabIndex={-1}>
                  {index === 0 ? 'London branch' : 'Thrapston branch'}
                </h1>
              </Reveal>
              <Reveal className={`warehouse-card ${index === 1 ? 'warehouse-card-reverse' : ''}`}>
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
              <button
                type="button"
                className="contact-next"
                onClick={() => showSection(index + 1)}
                aria-controls={index === 0 ? 'contact-branch-1' : 'contact-team'}
              >
                <span>{index === 0 ? 'Thrapston branch' : 'Talk to us'}</span>
                <Icon name="arrow" size={26} />
              </button>
            </div>
          </section>
        ))}
        <section
          id="contact-team"
          className="contact-panel contact-team-panel"
          aria-labelledby="contact-team-heading"
          aria-hidden={section !== 2}
          inert={section !== 2}
        >
          <button
            type="button"
            className="contact-next contact-back"
            onClick={() => showSection(1)}
            aria-label="Back to Thrapston branch"
            aria-controls="contact-branch-1"
          >
            <span>THRAPSTON BRANCH</span>
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
    </div>
  );
}
