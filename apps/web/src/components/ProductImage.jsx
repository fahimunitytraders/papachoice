import { localAsset } from '@papas-choice/content';
export default function ProductImage({
  crop,
  label,
  className = '',
  src = '/assets/food-concept.png',
}) {
  if (!crop?.length)
    return (
      <img
        className={`product-image ${className}`}
        src={localAsset(src)}
        alt={label}
        loading="lazy"
      />
    );
  return (
    <svg
      className={`product-image ${className}`}
      viewBox={crop.join(' ')}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid slice"
    >
      <image href={localAsset(src)} width="1536" height="1024" />
    </svg>
  );
}
