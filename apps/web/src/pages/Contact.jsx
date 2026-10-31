import { localAsset } from '@papas-choice/content';
import { useContent } from '../context/ContentContext.jsx';
import Reveal from '../components/Reveal.jsx';
import Icon from '../components/Icon.jsx';
export default function Contact() {
  const {
    content: { contact: c },
  } = useContent();
  const phone = c.phone.replace(/[^+\d]/g, '');
  const whatsapp = c.whatsapp.replace(/\D/g, '');
  return (
    <section className="container page-section">
      <Reveal className="page-heading">
        <p className="eyebrow">COME SAY HELLO</p>
        <h1>
          Good conversations.
          <br />
          Great food.
        </h1>
        <p>Find us in London and Thrapston, or speak to our team.</p>
      </Reveal>
      <div className="contact-grid">
        <Reveal className="contact-card">
          <span className="eyebrow">01 / TALK TO US</span>
          <h2>We’re here to help.</h2>
          <a className="contact-big" href={`tel:${phone}`}>
            {c.phone}
          </a>
          <a className="button" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
            Message on WhatsApp
            <Icon name="arrow" />
          </a>
          {c.email && (
            <a className="text-link" href={`mailto:${c.email}`}>
              {c.email}
            </a>
          )}
        </Reveal>
        <Reveal className="contact-card" delay={100}>
          <span className="eyebrow">LONDON CASH & CARRY</span>
          <h2>Plan your visit.</h2>
          <p>
            {c.hours}
            <br />
            {c.sunday}
          </p>
          <p>For visits to our Thrapston warehouse, please contact our team.</p>
        </Reveal>
      </div>
      <section className="warehouse-section" aria-labelledby="warehouse-heading">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">FIND US</p>
            <h2 id="warehouse-heading">Two locations. One warm welcome.</h2>
          </div>
        </Reveal>
        <div className="warehouse-grid">
          {c.warehouses.map((warehouse, index) => (
            <Reveal className="warehouse-card" delay={index * 100} key={warehouse.name}>
              <img
                src={localAsset(warehouse.image)}
                alt={warehouse.alt}
                loading="lazy"
                width="1280"
                height="960"
              />
              <div className="warehouse-details">
                <h3>{warehouse.name}</h3>
                <address>{warehouse.address}</address>
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
      </section>
    </section>
  );
}
