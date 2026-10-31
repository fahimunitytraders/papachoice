import { Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext.jsx';
import { localAsset } from '@papas-choice/content';
import ProductCard from '../components/ProductCard.jsx';
import HeroSlider from '../components/HeroSlider.jsx';
import PartnerSlider from '../components/PartnerSlider.jsx';
import Reveal from '../components/Reveal.jsx';
import Icon from '../components/Icon.jsx';
export default function Home({ onDetails }) {
  const { content: c } = useContent();
  const h = c.home;
  return (
    <>
      <section className="hero container">
        <Reveal className="hero-image">
          <HeroSlider />
        </Reveal>
        <Reveal className="hero-copy" delay={120}>
          <p className="eyebrow">{h.eyebrow}</p>
          <h1>{h.title}</h1>
          <p className="hero-description">{h.description}</p>
          <Link className="button hero-cta" to={h.primaryTarget}>
            {h.primaryButton}
            <Icon name="arrow" />
          </Link>
          <Link className="text-link hero-secondary" to={h.secondaryTarget}>
            {h.secondaryButton}
            <Icon name="arrow" size={16} />
          </Link>
        </Reveal>
      </section>
      <section className="container collection-section">
        <nav className="category-tabs" aria-label="Shop categories">
          <Link className="active" to="/products">
            All products
          </Link>
          {c.categories.map((category) => (
            <Link key={category} to={`/products?category=${encodeURIComponent(category)}`}>
              {category}
            </Link>
          ))}
        </nav>
        <div className="section-heading">
          <div>
            <p className="eyebrow">{h.collectionEyebrow}</p>
            <h2>{h.collectionTitle}</h2>
            <p className="muted small">{h.collectionDescription}</p>
          </div>
          <Link className="text-link" to="/products">
            {h.allProductsButton}
            <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {c.products
            .filter((p) => p.bestSeller)
            .map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <ProductCard product={p} onDetails={onDetails} />
              </Reveal>
            ))}
        </div>
        <p className="price-notice">{c.catalogue.priceNotice}</p>
      </section>
      <PartnerSlider />
      <section className="container home-story">
        <Reveal className="home-story-image">
          <img
            src={localAsset('/assets/mission.png')}
            alt="Sharing African food around a family table"
            loading="lazy"
          />
        </Reveal>
        <Reveal className="home-story-copy">
          <p className="eyebrow">{h.storyEyebrow}</p>
          <h2>{h.storyTitle}</h2>
          <p>{h.storyText}</p>
          <Link className="text-link" to="/about">
            {h.storyButton}
            <Icon name="arrow" />
          </Link>
        </Reveal>
      </section>
      <Reveal className="container visit-banner">
        <div>
          <p className="eyebrow">YOUR LOCAL CASH & CARRY</p>
          <h2>{h.visitTitle}</h2>
          <p>{h.visitText}</p>
        </div>
        <Link className="button button-dark" to="/contact">
          {h.visitButton}
          <Icon name="arrow" />
        </Link>
      </Reveal>
    </>
  );
}
