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
        <p>Visit our London cash and carry or speak to our team.</p>
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
          <span className="eyebrow">02 / FIND US</span>
          <h2>A warm welcome.</h2>
          <p>{c.address}</p>
          <p>
            {c.hours}
            <br />
            {c.sunday}
          </p>
          <a
            className="text-link"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`}
            target="_blank"
            rel="noreferrer"
          >
            Get directions
            <Icon name="arrow" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
