import { text } from '@papas-choice/content';
import { useContent } from '../context/ContentContext.jsx';
import Reveal from '../components/Reveal.jsx';
import Icon from '../components/Icon.jsx';
export default function Contact() {
  const {
    content: { contact: c },
  } = useContent();
  return (
    <section className="contact-team-panel contact-page" aria-labelledby="contact-team-heading">
      <Reveal className="container contact-team-content">
        <p className="eyebrow">{text('Contact.a_good_conversation_starts_here')}</p>
        <h1 id="contact-team-heading">{text('Contact.let_s_talk')}</h1>
        <p>{text('Contact.questions_about_our_products_or_planning_a_visit_we_re_here_to_he')}</p>
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
  );
}
