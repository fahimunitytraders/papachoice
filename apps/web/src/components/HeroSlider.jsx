import { text } from '@papas-choice/content';
import { useEffect, useState } from 'react';
import { localAsset } from '@papas-choice/content';
import ProductImage from './ProductImage.jsx';
import Icon from './Icon.jsx';

export default function HeroSlider() {
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
    const timer = window.setTimeout(() => setActive((value) => (value + 1) % 2), 3000);
    return () => window.clearTimeout(timer);
  }, [active, focused, reduced, visible]);
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
          <div
            className={`hero-slide ${active === 0 ? 'is-active' : ''}`}
            role="group"
            aria-roledescription="slide"
            aria-label={text('HeroSlider.1_of_2')}
            aria-hidden={active !== 0}
          >
            <ProductImage
              crop={[80, 76, 765, 465]}
              label={text(
                'HeroSlider.papa_s_choice_nigerian_palm_oil_cocoyam_fufu_flour_and_pepper_sou',
              )}
            />
          </div>
          <div
            className={`hero-slide ${active === 1 ? 'is-active' : ''}`}
            role="group"
            aria-roledescription="slide"
            aria-label={text('HeroSlider.2_of_2')}
            aria-hidden={active !== 1}
          >
            <img
              src={localAsset('/assets/hero/papas-choice-range.jpg')}
              alt={text(
                'HeroSlider.papa_s_choice_golden_sella_basmati_rice_nigerian_palm_oil_and_pla',
              )}
              decoding="async"
            />
          </div>
        </div>
      </div>
      <button
        type="button"
        className="hero-slider-arrow hero-slider-prev"
        aria-label={text('HeroSlider.previous_product_image')}
        onClick={() => setActive((value) => (value + 1) % 2)}
      >
        <Icon name="arrow" />
      </button>
      <button
        type="button"
        className="hero-slider-arrow hero-slider-next"
        aria-label={text('HeroSlider.next_product_image')}
        onClick={() => setActive((value) => (value + 1) % 2)}
      >
        <Icon name="arrow" />
      </button>
      <div className="hero-slider-controls">
        <div className="hero-slider-dots" aria-label={text('HeroSlider.choose_product_image')}>
          {[0, 1].map((index) => (
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
