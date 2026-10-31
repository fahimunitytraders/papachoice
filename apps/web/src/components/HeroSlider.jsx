import { useEffect, useState } from 'react';
import { localAsset } from '@papas-choice/content';
import ProductImage from './ProductImage.jsx';
import Icon from './Icon.jsx';

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduced(media.matches);
    const updateVisibility = () => setVisible(!document.hidden);
    media.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      media.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);
  useEffect(() => {
    if (hovered || focused || reduced || !visible) return;
    const timer = window.setTimeout(() => setActive((value) => (value + 1) % 2), 3000);
    return () => window.clearTimeout(timer);
  }, [active, hovered, focused, reduced, visible]);
  return (
    <section
      className="hero-slider"
      aria-label="Papa’s Choice product highlights"
      aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="hero-slider-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        <div
          className={`hero-slide ${active === 0 ? 'is-active' : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label="1 of 2"
          aria-hidden={active !== 0}
        >
          <ProductImage
            crop={[80, 76, 765, 465]}
            label="Papa’s Choice Nigerian Palm Oil, Cocoyam Fufu Flour and Pepper Soup Mix"
          />
        </div>
        <div
          className={`hero-slide ${active === 1 ? 'is-active' : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label="2 of 2"
          aria-hidden={active !== 1}
        >
          <img
            src={localAsset('/assets/hero/papas-choice-range.jpg')}
            alt="Papa’s Choice Golden Sella Basmati Rice, Nigerian Palm Oil and Plantain Fufu Flour"
            decoding="async"
          />
        </div>
      </div>
      <button
        type="button"
        className="hero-slider-arrow hero-slider-prev"
        aria-label="Previous product image"
        onClick={() => setActive((value) => (value + 1) % 2)}
      >
        <Icon name="arrow" />
      </button>
      <button
        type="button"
        className="hero-slider-arrow hero-slider-next"
        aria-label="Next product image"
        onClick={() => setActive((value) => (value + 1) % 2)}
      >
        <Icon name="arrow" />
      </button>
      <div className="hero-slider-controls">
        <div className="hero-slider-dots" aria-label="Choose product image">
          {[0, 1].map((index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show product image ${index + 1}`}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
