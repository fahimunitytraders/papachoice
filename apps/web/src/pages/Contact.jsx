import { text } from '@papas-choice/content';
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
        <section
          id="contact-branches"
          className="contact-panel warehouse-panel combined-branches"
          aria-labelledby="contact-branches-heading"
          aria-hidden={section !== 0}
          inert={section !== 0}
        >
          <div className="container">
            <h1 id="contact-branches-heading" className="contact-branches-heading" tabIndex={-1}>
              {text('Contact.where_to_find_us')}
            </h1>
            <div className="branch-pair">
              {c.warehouses.map((warehouse, index) => (
                <Reveal
                  key={warehouse.name}
                  className={`warehouse-card ${index === 1 ? 'warehouse-card-reverse' : ''}`}
                >
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
                        {warehouse.hours || text('Contact.contact_us_to_confirm_opening_times')}
                        {index === 0 && <span className="warehouse-sunday">{c.sunday}</span>}
                      </li>
                      <li>{text('Contact.free_parking')}</li>
                      <li>
                        {text('Contact.cash_and_carry')}
                        {warehouse.cashAndCarry ? 'available' : 'not available'}
                      </li>
                    </ul>
                    <a
                      className="text-link"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(warehouse.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={text('Contact.get_directions_to_0', [warehouse.name])}
                    >
                      {text('Contact.get_directions')}
                      <Icon name="arrow" />
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>
            <button
              type="button"
              className="contact-next"
              onClick={() => showSection(1)}
              aria-controls="contact-team"
            >
              <span>{text('Contact.talk_to_us')}</span>
              <Icon name="arrow" size={26} />
            </button>
          </div>
        </section>
        <section
          id="contact-team"
          className="contact-panel contact-team-panel"
          aria-labelledby="contact-team-heading"
          aria-hidden={section !== 1}
          inert={section !== 1}
        >
          <button
            type="button"
            className="contact-next contact-back"
            onClick={() => showSection(0)}
            aria-label={text('Contact.find_us')}
            aria-controls="contact-branches"
          >
            <span>{text('Contact.find_us_2')}</span>
            <Icon name="arrow" size={26} />
          </button>
          <Reveal className="container contact-team-content">
            <p className="eyebrow">{text('Contact.a_good_conversation_starts_here')}</p>
            <h2 id="contact-team-heading" tabIndex={-1}>
              {text('Contact.let_s_talk')}
            </h2>
            <p>
              {text('Contact.questions_about_our_products_or_planning_a_visit_we_re_here_to_he')}
            </p>
            <a className="contact-team-phone" href={`tel:${c.phone.replace(/[^+\d]/g, '')}`}>
              {c.phone}
            </a>
            <a
              className="button"
              href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
            >
              {text('Contact.message_on_whatsapp')}
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
