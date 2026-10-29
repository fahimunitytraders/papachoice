import { useSearchParams } from 'react-router-dom';
import { filterProducts } from '@papas-choice/content';
import { useContent } from '../context/ContentContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Icon from '../components/Icon.jsx';
import Reveal from '../components/Reveal.jsx';
export default function Products({ onDetails }) {
  const { content: c } = useContent();
  const [params, setParams] = useSearchParams();
  const categories = ['All products', ...c.categories];
  const category = categories.includes(params.get('category'))
    ? params.get('category')
    : 'All products';
  const query = params.get('q') || '';
  const sort = params.get('sort') || 'featured';
  function change(key, value) {
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        value ? next.set(key, value) : next.delete(key);
        return next;
      },
      { replace: true },
    );
  }
  const shown = filterProducts(c.products, category, query, sort);
  return (
    <section className="container page-section">
      <Reveal className="page-heading">
        <p className="eyebrow">{c.catalogue.eyebrow}</p>
        <h1>{c.catalogue.title}</h1>
        <p>{c.catalogue.description}</p>
      </Reveal>
      <div className="catalogue-layout">
        <aside className="catalogue-sidebar">
          <h2>Browse categories</h2>
          {categories.map((cat) => (
            <button
              key={cat}
              aria-label={cat}
              className={category === cat ? 'active' : ''}
              aria-pressed={category === cat}
              onClick={() => change('category', cat)}
            >
              {cat}
              <span>
                {cat === 'All products'
                  ? c.products.length
                  : c.products.filter((p) => p.category === cat).length}
              </span>
            </button>
          ))}
          <div className="sidebar-note">
            <Icon name="box" />
            <h3>Personal service.</h3>
            <p>Browse our range, then call or message us to discuss your order.</p>
          </div>
        </aside>
        <div className="catalogue-main">
          <div className="catalogue-toolbar">
            <label className="search-field">
              <Icon name="search" size={18} />
              <input
                aria-label="Search catalogue"
                value={query}
                placeholder={c.catalogue.searchPlaceholder}
                onChange={(e) => change('q', e.target.value)}
              />
            </label>
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => change('sort', e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
          <p className="result-count" aria-live="polite">
            {shown.length} {shown.length === 1 ? 'product' : 'products'}
          </p>
          {shown.length ? (
            <div className="product-grid catalogue-grid">
              {shown.map((p) => (
                <ProductCard key={p.id} product={p} onDetails={onDetails} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="search" size={38} />
              <h2>No products found</h2>
              <p>Try a different search or browse all categories.</p>
              <button className="button" onClick={() => setParams({})}>
                Clear filters
              </button>
            </div>
          )}
          <p className="price-notice">{c.catalogue.priceNotice}</p>
        </div>
      </div>
    </section>
  );
}
