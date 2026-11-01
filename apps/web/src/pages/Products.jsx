import { text } from '@papas-choice/content';
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
          <h2>{text('Products.browse_categories')}</h2>
          {categories.map((cat) => (
            <button
              key={cat === 'All products' ? text('Products.all_products') : cat}
              aria-label={cat === 'All products' ? text('Products.all_products') : cat}
              className={category === cat ? 'active' : ''}
              aria-pressed={category === cat}
              onClick={() => change('category', cat)}
            >
              {cat === 'All products' ? text('Products.all_products') : cat}
              <span>
                {cat === 'All products'
                  ? c.products.length
                  : c.products.filter((p) => p.category === cat).length}
              </span>
            </button>
          ))}
          <div className="sidebar-note">
            <Icon name="box" />
            <h3>{text('Products.personal_service')}</h3>
            <p>{text('Products.browse_our_range_then_call_or_message_us_to_discuss_your_order')}</p>
          </div>
        </aside>
        <div className="catalogue-main">
          <div className="catalogue-toolbar">
            <label className="search-field">
              <Icon name="search" size={18} />
              <input
                aria-label={text('Products.search_catalogue')}
                value={query}
                placeholder={c.catalogue.searchPlaceholder}
                onChange={(e) => change('q', e.target.value)}
              />
            </label>
            <select
              aria-label={text('Products.sort_products')}
              value={sort}
              onChange={(e) => change('sort', e.target.value)}
            >
              <option value="featured">{text('Products.featured')}</option>
              <option value="price-low">{text('Products.price_low_to_high')}</option>
              <option value="price-high">{text('Products.price_high_to_low')}</option>
              <option value="name">{text('Products.name_a_to_z')}</option>
            </select>
          </div>
          <p className="result-count" aria-live="polite">
            {shown.length}{' '}
            {shown.length === 1
              ? text('Products.product_singular')
              : text('Products.product_plural')}
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
              <h2>{text('Products.no_products_found')}</h2>
              <p>{text('Products.try_a_different_search_or_browse_all_categories')}</p>
              <button className="button" onClick={() => setParams({})}>
                {text('Products.clear_filters')}
              </button>
            </div>
          )}
          <p className="price-notice">{c.catalogue.priceNotice}</p>
        </div>
      </div>
    </section>
  );
}
