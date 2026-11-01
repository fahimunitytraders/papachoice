import { text } from '@papas-choice/content';
import { useEffect, useState } from 'react';
import { useContent } from '../context/ContentContext.jsx';
import ProductImage from './ProductImage.jsx';
import Icon from './Icon.jsx';

export default function HeroSlider() {
  const { content } = useContent();
  const slides = content.home.heroSlides;
  const [active, setActive] = useState(0);
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
    if (focused || reduced || !visible) return;
    const timer = window.setTimeout(() => setActive((value) => (value + 1) % slides.length), 3000);
    return () => window.clearTimeout(timer);
  }, [active, focused, reduced, visible, slides.length]);
  return (
    <section
      className="hero-slider"
      aria-label={text('HeroSlider.papa_s_choice_product_highlights')}
      aria-roledescription="carousel"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="hero-slider-viewport">
        <div className="hero-slider-track" style={{ transform: `translateX(-${active * 100}%)` }}>
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`hero-slide ${active === index ? 'is-active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
              aria-hidden={active !== index}
            >
              <ProductImage src={slide.image} crop={slide.crop} label={slide.alt} />
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="hero-slider-arrow hero-slider-prev"
        aria-label={text('HeroSlider.previous_product_image')}
        onClick={() => setActive((value) => (value - 1 + slides.length) % slides.length)}
      >
        <Icon name="arrow" />
      </button>
      <button
        type="button"
        className="hero-slider-arrow hero-slider-next"
        aria-label={text('HeroSlider.next_product_image')}
        onClick={() => setActive((value) => (value + 1) % slides.length)}
      >
        <Icon name="arrow" />
      </button>
      <div className="hero-slider-controls">
        <div className="hero-slider-dots" aria-label={text('HeroSlider.choose_product_image')}>
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={text('HeroSlider.show_product_image_0', [index + 1])}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
