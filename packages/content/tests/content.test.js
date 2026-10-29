import test from 'node:test';
import assert from 'node:assert/strict';
<<<<<<< HEAD
import { defaultContent, cloneContent, validateContent, filterProducts } from '../index.js';
=======
import { defaultContent, cloneContent, validateContent, filterProducts, money } from '../index.js';
>>>>>>> origin/fullprods
const fresh = () => cloneContent(defaultContent);
test('bundled content validates and unknown keys are discarded', () => {
  const data = fresh();
  data.untrusted = 'ignored';
  const result = validateContent(data);
<<<<<<< HEAD
  assert.equal(result.products.length, 3);
=======
  assert.equal(result.products.length, 73);
>>>>>>> origin/fullprods
  assert.equal(result.partners.length, 7);
  assert.equal(result.untrusted, undefined);
  assert.notEqual(result, data);
});
test('rejects invalid colours and executable links', () => {
  const data = fresh();
  data.theme.accent = 'red';
  assert.throws(() => validateContent(data), /hex colour/);
  data.theme.accent = '#AABBCC';
  data.home.primaryTarget = 'javascript:alert(1)';
  assert.throws(() => validateContent(data), /existing page/);
  data.home.primaryTarget = '/products';
  data.partners[0].website = 'javascript:alert(1)';
  assert.throws(() => validateContent(data), /https/);
});
test('rejects missing sections, invalid categories, duplicate IDs and non-finite prices', () => {
  let data = fresh();
  delete data.home;
  assert.throws(() => validateContent(data), /missing/);
  data = fresh();
  data.products[0].category = 'Missing';
  assert.throws(() => validateContent(data), /existing category/);
  data = fresh();
  data.products[1].id = data.products[0].id;
  assert.throws(() => validateContent(data), /unique IDs/);
  data = fresh();
  data.products[0].price = Infinity;
  assert.throws(() => validateContent(data), /valid non-negative/);
});
test('crop, logo and image paths reject invalid inputs', () => {
  let data = fresh();
  data.products[0].crop = [0, 0, 0, 10];
  assert.throws(() => validateContent(data), /crop/);
  data = fresh();
  data.products[0].image = 'data:text/html,bad';
  assert.throws(() => validateContent(data), /HTTPS/);
  data = fresh();
  data.brand.logo = 'javascript:alert(1)';
  assert.throws(() => validateContent(data), /HTTPS/);
});
test('search uses names, brands and SKU and sorting is nonmutating', () => {
  const products = fresh().products;
  assert.equal(filterProducts(products, 'Flour & mixes', 'cocoyam').length, 1);
<<<<<<< HEAD
  assert.equal(filterProducts(products, 'All products', "Papa's Choice").length, 3);
  assert.equal(filterProducts(products, 'All products', 'PC-003')[0].id, 'pepper-soup');
  assert.equal(filterProducts(products, 'Seasonings', 'palm').length, 0);
  assert.deepEqual(
    filterProducts(products, 'All products', '', 'price-low').map((p) => p.price),
=======
  assert.equal(filterProducts(products, 'All products', "Papa's Choice").length, 68);
  assert.equal(filterProducts(products, 'All products', 'PC-003')[0].id, 'pepper-soup');
  assert.equal(filterProducts(products, 'Seasonings', 'palm').length, 0);
  assert.deepEqual(
    filterProducts(products, 'All products', '', 'price-low')
      .slice(0, 3)
      .map((p) => p.price),
>>>>>>> origin/fullprods
    [2.99, 3.49, 9.99],
  );
  assert.equal(products[0].id, 'palm-oil');
});
<<<<<<< HEAD
=======
test('unpriced products survive editing and sort after known prices in both directions', () => {
  const data = fresh();
  data.products[0].price = null;
  assert.equal(validateContent(data).products[0].price, null);
  assert.equal(money(null), 'Price on enquiry');
  assert.equal(money(0), '£0.00');
  for (const sort of ['price-low', 'price-high']) {
    const sorted = filterProducts(defaultContent.products, 'All products', '', sort);
    assert.ok(sorted.slice(3).every((p) => p.price === null));
  }
  assert.deepEqual(
    filterProducts(defaultContent.products, 'All products', '', 'price-high')
      .slice(0, 3)
      .map((p) => p.price),
    [9.99, 3.49, 2.99],
  );
  data.products[0].price = '';
  assert.throws(() => validateContent(data), /valid non-negative/);
});
>>>>>>> origin/fullprods
