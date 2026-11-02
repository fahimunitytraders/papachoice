import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal.jsx';
import Icon from '../components/Icon.jsx';

export default function Delivery() {
  const imageBase = `${import.meta.env.BASE_URL}assets/delivery/`;

  return (
    <section className="container delivery-page">
      <div className="delivery-intro">
        <Reveal className="delivery-copy">
          <p className="eyebrow">Wholesale delivery</p>
          <h1>Good food. Across the UK.</h1>
          <p className="delivery-lead">
            We deliver African and international foods directly to businesses across the whole UK.
          </p>
          <p className="delivery-minimum">
            Minimum delivery order: <strong>£1,000</strong>.
          </p>
          <p>
            Stock up on the flavours your customers love. Register your business to discuss your
            order and delivery arrangements with our team.
          </p>
          <Link className="button button-dark" to="/register">
            Register for delivery <Icon name="arrow" />
          </Link>
        </Reveal>
        <Reveal className="delivery-photo" delay={120}>
          <img
            src={`${imageBase}papas-choice-truck.jpg`}
            alt="Papa’s Choice delivery truck with branded blue livery"
          />
        </Reveal>
      </div>

      <div className="delivery-steps">
        <div>
          <p className="eyebrow">Getting started</p>
          <h2>Your next order starts here.</h2>
        </div>
        <ol>
          <li>
            <span>01</span>
            <h3>Register your business</h3>
            <p>Tell us about your business and where you need your delivery.</p>
          </li>
          <li>
            <span>02</span>
            <h3>Choose your range</h3>
            <p>Explore our products and plan a wholesale order of £1,000 or more.</p>
          </li>
          <li>
            <span>03</span>
            <h3>Arrange your delivery</h3>
            <p>Our team will confirm delivery availability, charges and timing for your address.</p>
          </li>
        </ol>
      </div>
    </section>
  );
}
