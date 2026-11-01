import { text } from '@papas-choice/content';
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
            {text('Register.good_things')}
            <br />
            {text('Register.by_the_case')}
          </h2>
          <p>{text('Register.a_few_simple_steps_to_introduce_your_business')}</p>
          <ul>
            <li>{text('Register.business_and_contact_details')}</li>
            <li>{text('Register.delivery_arrangements')}</li>
            <li>{text('Register.trade_references')}</li>
            <li>{text('Register.your_declaration')}</li>
          </ul>
        </aside>
        <div className="registration-panel">
          {complete ? (
            <div className="empty-state success-state" role="status">
              <Icon name="check" size={44} />
              <h2>{text('Register.registration_sent')}</h2>
              <p>
                {text('Register.our_team_will_review_your_details_and_contact_you_about_your_acco')}
              </p>
              <Link to="/products" className="button">
                {text('Register.explore_the_collection')}
                <Icon name="arrow" />
              </Link>
              <button className="text-button" onClick={() => setComplete(false)}>
                {text('Register.start_again')}
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
