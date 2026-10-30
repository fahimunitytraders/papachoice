import { useState } from 'react';
import { useContent } from '../context/ContentContext.jsx';
import { Link } from 'react-router-dom';
import RegistrationForm from '../components/RegistrationForm.jsx';
import Icon from '../components/Icon.jsx';
export default function Register() {
  const [complete, setComplete] = useState(false);
  const {
    content: { registerCopy: copy },
  } = useContent();
  return (
    <section className="container page-section registration-page">
      <header className="page-heading reveal">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>
      <div className="registration-layout">
        <aside className="registration-aside">
          <Icon name="box" size={32} />
          <h2>
            Good things,
            <br />
            by the case.
          </h2>
          <p>A few simple steps to introduce your business.</p>
          <ul>
            <li>Business and contact details</li>
            <li>Delivery arrangements</li>
            <li>Trade references</li>
            <li>Your declaration</li>
          </ul>
        </aside>
        <div className="registration-panel">
          {complete ? (
            <div className="empty-state success-state" role="status">
              <Icon name="check" size={44} />
              <h2>Registration sent</h2>
              <p>Our team will review your details and contact you about your account.</p>
              <Link to="/products" className="button">
                Explore the collection
                <Icon name="arrow" />
              </Link>
              <button className="text-button" onClick={() => setComplete(false)}>
                Start again
              </button>
            </div>
          ) : (
            <RegistrationForm
              onDone={() => {
                setComplete(true);
                window.scrollTo({ top: 0 });
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
