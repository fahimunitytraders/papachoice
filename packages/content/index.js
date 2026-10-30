import defaults from './defaults.json' with { type: 'json' };
export const defaultContent = defaults;
export const cloneContent = (value) => JSON.parse(JSON.stringify(value));
export const money = (value) =>
  value === null
    ? 'Price on enquiry'
    : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
export const localAsset = (path) =>
  path.startsWith('/assets/') ? `${import.meta.env?.BASE_URL || './'}${path.slice(1)}` : path;
export const allowedTargets = [
  '/',
  '/about',
  '/products',
  '/partners',
  '/careers',
  '/register',
  '/contact',
];
export const isHex = (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
export function validAsset(value) {
  return (
    typeof value === 'string' &&
    (value === '' || /^\/assets\/[a-z0-9/_.-]+$/i.test(value) || /^https:\/\/[^\s]+$/i.test(value))
  );
}
export function validateContent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Choose a Papa’s Choice content JSON file.');
  if (input.schemaVersion !== 1)
    throw new Error('Unsupported content version. Expected version 1.');
  function shape(value, template, path) {
    if (typeof template === 'string') {
      if (typeof value !== 'string' || value.length > 12000)
        throw new Error(`${path} must be text under 12,000 characters.`);
      return value;
    }
    if (typeof template === 'number') {
      if (/^content\.products\.\d+\.price$/.test(path) && value === null) return null;
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100000)
        throw new Error(`${path} must be a valid non-negative number.`);
      return value;
    }
    if (typeof template === 'boolean') {
      if (typeof value !== 'boolean') throw new Error(`${path} must be true or false.`);
      return value;
    }
    if (Array.isArray(template)) {
      if (!Array.isArray(value) || value.length > 200)
        throw new Error(`${path} must be a list with at most 200 items.`);
      return value.map((v, i) => shape(v, template[0], `${path}.${i}`));
    }
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error(`${path} is missing.`);
    return Object.fromEntries(
      Object.entries(template).map(([key, t]) => [key, shape(value[key], t, `${path}.${key}`)]),
    );
  }
  const result = shape(input, defaults, 'content');
  for (const [key, value] of Object.entries(result.theme))
    if (!isHex(value)) throw new Error(`Use a six digit hex colour for ${key}, such as #D7B99A.`);
  for (const key of ['primaryTarget', 'secondaryTarget'])
    if (!allowedTargets.includes(result.home[key]))
      throw new Error('Choose an existing page for the homepage button.');
  if (!result.brand.name.trim()) throw new Error('The company name cannot be empty.');
  if (!validAsset(result.brand.logo))
    throw new Error('Use a local asset path or HTTPS URL for the logo.');
  if (
    result.categories.length === 0 ||
    result.categories.some((c) => !c.trim()) ||
    new Set(result.categories).size !== result.categories.length
  )
    throw new Error('Use unique, non-empty categories.');
  for (const list of [result.products, result.partners, result.about.sections]) {
    const ids = new Set();
    for (const item of list) {
      if (!/^[a-z0-9-]+$/.test(item.id) || ids.has(item.id))
        throw new Error('Items need unique IDs using lowercase letters, numbers and hyphens.');
      ids.add(item.id);
    }
  }
  for (const product of result.products) {
    if (!product.name.trim() || !product.brand.trim())
      throw new Error('Every product needs a name and brand.');
    if (!result.categories.includes(product.category))
      throw new Error(`Choose an existing category for ${product.name}.`);
    if (!validAsset(product.image))
      throw new Error('Use a local asset path or HTTPS URL for product images.');
    if (
      product.crop.length !== 0 &&
      (product.crop.length !== 4 || product.crop[2] <= 0 || product.crop[3] <= 0)
    )
      throw new Error('A crop must be empty or contain x, y, width and height.');
  }
  for (const partner of result.partners) {
    if (!partner.name.trim() || !validAsset(partner.logo))
      throw new Error('Partners need a name and a valid logo path.');
    if (partner.website && !/^https:\/\/[^\s]+$/i.test(partner.website))
      throw new Error('Partner website links must start with https://.');
  }
  for (const section of result.about.sections)
    if (!validAsset(section.image)) throw new Error('Use valid image paths in About sections.');
  if (
    !/^[+\d ()-]{7,30}$/.test(result.contact.phone) ||
    !/^[+\d ()-]{7,30}$/.test(result.contact.whatsapp)
  )
    throw new Error('Enter valid contact phone numbers.');
  if (result.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.contact.email))
    throw new Error('Enter a valid email address or leave it blank.');
  return result;
}
export function filterProducts(products, category, query, sort = 'featured') {
  const result = products.filter(
    (p) =>
      (category === 'All products' || p.category === category) &&
      `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(query.toLowerCase().trim()),
  );
  if (sort === 'price-low' || sort === 'price-high') {
    result.sort((a, b) => {
      if (a.price === null) return b.price === null ? 0 : 1;
      if (b.price === null) return -1;
      return sort === 'price-low' ? a.price - b.price : b.price - a.price;
    });
  }
  if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
