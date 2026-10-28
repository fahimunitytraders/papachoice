import { useState } from 'react';
import { Link } from 'react-router-dom';
import { localAsset } from '@papas-choice/content';
import { useContent } from '../context/ContentContext.jsx';
import Icon from './Icon.jsx';
export function PartnerLogo({ partner }) {
  const [failed, setFailed] = useState(false);
  return partner.logo && !failed ? (
    <img
      src={localAsset(partner.logo)}
      alt={partner.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="partner-fallback">{partner.name}</span>
  );
}
export default function PartnerSlider() {
  const { content } = useContent();
  const [paused, setPaused] = useState(false);
  if (!content.partners.length) return null;
  return (
    <section className="partner-section container" aria-label="Our partners">
      <div className="section-heading">
        <div>
          <p className="eyebrow">OUR PARTNERS</p>
          <h2>{content.partnersPage.sliderTitle}</h2>
          <p className="muted small">{content.partnersPage.sliderDescription}</p>
        </div>
        <div className="slider-actions">
          <button
            className="icon-button pause-button"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? 'Play partner animation' : 'Pause partner animation'}
            aria-pressed={paused}
          >
            {paused ? '▶' : 'Ⅱ'}
          </button>
          <Link className="text-link" to="/partners">
            {content.partnersPage.allButton}
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
      <div className={`partner-window ${paused ? 'paused' : ''}`}>
        <div className="partner-track">
          <div className="partner-group">
            {content.partners.map((p) => (
              <Link
                to={`/partners?q=${encodeURIComponent(p.name)}`}
                key={p.id}
                className="partner-logo"
                aria-label={`View partner ${p.name}`}
              >
                <PartnerLogo partner={p} />
              </Link>
            ))}
          </div>
          <div className="partner-group partner-duplicate" aria-hidden="true">
            {content.partners.map((p) => (
              <div key={p.id} className="partner-logo">
                <PartnerLogo partner={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
