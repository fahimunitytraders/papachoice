import { money } from '@papas-choice/content';
import { useContent } from '../context/ContentContext.jsx';
import ProductImage from './ProductImage.jsx';
import Icon from './Icon.jsx';
export default function ProductCard({ product, onDetails }) {
  const { content } = useContent();
  return (
    <article className="product-card">
      <button
        className="image-button"
        onClick={() => onDetails(product)}
        aria-label={`View ${product.name}`}
      >
        <ProductImage src={product.image} crop={product.crop} label={product.name} />
        <span className="quick-view">
          Explore <Icon name="arrow" size={16} />
        </span>
      </button>
      <p className="product-brand">{product.brand}</p>
      <button className="product-title" onClick={() => onDetails(product)}>
        {product.name}
      </button>
      <p className="product-size">
        {product.size} · {product.category}
      </p>
      <div className="product-card-bottom">
<<<<<<< HEAD
        <div className="price">
          {money(product.price)}
          <span>
            {content.catalogue.priceLabel} · {product.priceBasis}
=======
        <div className={`price${product.price === null ? ' price-enquiry' : ''}`}>
          {money(product.price)}
          <span>
            {product.price === null
              ? 'Contact us for wholesale pricing'
              : `${content.catalogue.priceLabel} · ${product.priceBasis}`}
>>>>>>> origin/fullprods
          </span>
        </div>
        <button className="text-link" onClick={() => onDetails(product)}>
          {content.catalogue.detailButton}
          <Icon name="arrow" size={16} />
        </button>
      </div>
    </article>
  );
}
