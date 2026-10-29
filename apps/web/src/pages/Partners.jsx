import { useSearchParams, Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext.jsx';
import { PartnerLogo } from '../components/PartnerSlider.jsx';
import Reveal from '../components/Reveal.jsx';
import Icon from '../components/Icon.jsx';
export default function Partners() {
  const { content: c } = useContent();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const partners = c.partners.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="container page-section">
      <Reveal className="page-heading">
        <p className="eyebrow">{c.partnersPage.eyebrow}</p>
        <h1>{c.partnersPage.title}</h1>
        <p>{c.partnersPage.description}</p>
      </Reveal>
      <div className="partners-toolbar">
        <p className="small muted" aria-live="polite">
          {partners.length} partners
        </p>
        <label className="search-field">
          <Icon name="search" size={18} />
          <input
            placeholder="Find a brand"
            aria-label="Find a partner"
            value={query}
            onChange={(e) =>
              setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })
            }
          />
        </label>
      </div>
      <div className="partners-grid">
        {partners.map((p, i) => (
          <Reveal key={p.id} delay={Math.min(i, 5) * 60}>
            <article className="partner-card">
              <PartnerLogo partner={p} />
              <h2>{p.name}</h2>
              {p.website ? (
                <a className="text-link" href={p.website} target="_blank" rel="noreferrer">
                  Visit brand website
                  <Icon name="arrow" size={16} />
                </a>
              ) : (
                <Link className="text-link" to="/contact">
                  Ask about this brand
                  <Icon name="arrow" size={16} />
                </Link>
              )}
            </article>
          </Reveal>
        ))}
      </div>
      {!partners.length && (
        <div className="empty-state">
          <h2>No matching partners</h2>
          <button className="button" onClick={() => setParams({})}>
            Show all partners
          </button>
        </div>
      )}
      <Reveal className="visit-banner">
        <div>
          <p className="eyebrow">PARTNERSHIPS THAT LAST</p>
          <h2>{c.partnersPage.contactTitle}</h2>
          <p>{c.partnersPage.contactText}</p>
        </div>
        <Link className="button button-dark" to="/contact">
          {c.partnersPage.contactButton}
          <Icon name="arrow" />
        </Link>
      </Reveal>
    </section>
  );
}
