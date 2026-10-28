import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  allowedTargets,
  cloneContent,
  defaultContent,
  isHex,
  localAsset,
  validateContent,
} from '@papas-choice/content';
import { useContent } from '../context/ContentContext.jsx';
import Icon from '../components/Icon.jsx';
const labelOf = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
function EditorField({ label, value, onChange, type = 'text', options }) {
  const id = 'edit-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {options ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          rows={value?.length > 180 ? 5 : 3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={type}
          step={type === 'number' ? '0.01' : undefined}
          min={type === 'number' ? '0' : undefined}
          value={value}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        />
      )}
    </label>
  );
}
export default function Admin() {
  const { content, save, reset } = useContent();
  const [draft, setDraft] = useState(() => cloneContent(content));
  const [tab, setTab] = useState('Appearance');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetReady, setResetReady] = useState(false);
  const importInput = useRef(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content);
  useEffect(() => {
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function update(path, value) {
    setDraft((old) => {
      const next = cloneContent(old);
      let target = next;
      path.slice(0, -1).forEach((key) => (target = target[key]));
      target[path.at(-1)] = value;
      return next;
    });
    setMessage('');
    setError('');
  }
  function commit() {
    try {
      save(draft);
      setMessage('Saved in this browser. Open the site to see your changes.');
      setError('');
    } catch (e) {
      setError(
        e.message.includes('quota')
          ? 'Browser storage is full. Export your content before trying again.'
          : e.message,
      );
    }
  }
  function exportFile() {
    try {
      const data = validateContent(draft);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'papas-choice-content.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        'Content exported. Commit this file as packages/content/defaults.json to share it with the team.',
      );
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }
  async function importFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 512 * 1024)
        throw new Error('Choose a content JSON file smaller than 512 KB.');
      const value = validateContent(JSON.parse(await file.text()));
      setDraft(value);
      setMessage('Imported into the editor. Choose Save changes to apply.');
      setError('');
    } catch (e) {
      setError(e instanceof SyntaxError ? 'This file is not valid JSON.' : e.message);
    } finally {
      e.target.value = '';
    }
  }
  function textGroup(group, exclude = []) {
    return (
      <div className="editor-fields">
        {Object.entries(draft[group])
          .filter(([key, value]) => typeof value === 'string' && !exclude.includes(key))
          .map(([key, value]) => (
            <EditorField
              key={key}
              label={`${labelOf(group)}: ${labelOf(key)}`}
              value={value}
              onChange={(v) => update([group, key], v)}
              options={key.endsWith('Target') ? allowedTargets : undefined}
              type={
                value.length > 80 || /title|text|description|intro/i.test(key) ? 'textarea' : 'text'
              }
            />
          ))}
      </div>
    );
  }
  const tabs = ['Appearance', 'Page text', 'Products', 'Partners', 'Company'];
  return (
    <section className="container admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">YOUR SITE, YOUR STYLE</p>
          <h1>Site editor</h1>
          <p>Update colours, copy, buttons, products and partners.</p>
        </div>
        <Link className="button button-outline" to="/" target="_blank">
          Preview site
          <Icon name="arrow" />
        </Link>
      </div>
      <div className="editor-notice">
        <strong>Local preview editor</strong>
        <p>
          There is no admin login or server yet. Changes stay in this browser. Export the JSON to
          back up your work or share it with your team. Nothing is published automatically.
        </p>
      </div>
      <div className="editor-toolbar">
        <div className="editor-tabs" role="group" aria-label="Editor sections">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={tab === t ? 'active' : ''}
              aria-pressed={tab === t}
            >
              {t}
            </button>
          ))}
        </div>
        <button className="button" onClick={commit}>
          Save changes
          <Icon name="check" size={18} />
        </button>
      </div>
      {message && (
        <p role="status" className="editor-success">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <p className="small muted editor-dirty">
        {dirty ? 'You have unsaved changes.' : 'Your editor matches the saved site.'}
      </p>
      {tab === 'Appearance' && (
        <div className="editor-appearance">
          <div className="editor-fields">
            {Object.entries(draft.theme).map(([key, value]) => (
              <div className="colour-field" key={key}>
                <label>
                  <span>{labelOf(key)}</span>
                  <input
                    type="color"
                    aria-label={`${labelOf(key)} colour picker`}
                    value={isHex(value) ? value : '#000000'}
                    onChange={(e) => update(['theme', key], e.target.value)}
                  />
                </label>
                <input
                  aria-label={`${labelOf(key)} hex`}
                  value={value}
                  onChange={(e) => update(['theme', key], e.target.value)}
                  spellCheck="false"
                  maxLength={7}
                />
              </div>
            ))}
          </div>
          <div
            className="theme-sample"
            style={{
              background: draft.theme.background,
              color: draft.theme.text,
              borderColor: draft.theme.accent,
            }}
          >
            <div style={{ background: draft.theme.surface }}>
              <span style={{ color: draft.theme.brand }}>{draft.brand.name}</span>
              <h2>{draft.home.title}</h2>
              <p style={{ color: draft.theme.muted }}>{draft.home.description}</p>
              <span
                className="sample-button"
                style={{ background: draft.theme.accent, color: draft.theme.text }}
              >
                {draft.home.primaryButton} →
              </span>
            </div>
            <p className="small">Colour preview. Save to apply across the site.</p>
          </div>
          <details className="editor-group">
            <summary>Brand and logo</summary>
            {textGroup('brand')}
          </details>
        </div>
      )}
      {tab === 'Page text' && (
        <div>
          {[
            'navigation',
            'home',
            'catalogue',
            'about',
            'partnersPage',
            'careersCopy',
            'registerCopy',
            'footer',
          ].map((group) => (
            <details className="editor-group" key={group}>
              <summary>{labelOf(group)}</summary>
              {textGroup(group)}
              {group === 'about' &&
                draft.about.sections.map((section, i) => (
                  <fieldset key={section.id}>
                    <legend>{section.eyebrow}</legend>
                    {Object.entries(section)
                      .filter(([key]) => key !== 'id')
                      .map(([key, value]) => (
                        <EditorField
                          key={key}
                          label={`About section ${i + 1}: ${labelOf(key)}`}
                          value={value}
                          type={['title', 'text'].includes(key) ? 'textarea' : 'text'}
                          onChange={(v) => update(['about', 'sections', i, key], v)}
                        />
                      ))}
                  </fieldset>
                ))}
            </details>
          ))}
        </div>
      )}
      {tab === 'Products' && (
        <div>
          <p className="editor-help">
            Product prices are editable sample values. Update the catalogue price label and notice
            when you add verified pricing. To use a normal product image, enter its path or HTTPS
            URL and clear the crop.
          </p>
          <details className="editor-group">
            <summary>Categories</summary>
            {draft.categories.map((category, i) => (
              <div className="editor-inline" key={i}>
                <EditorField
                  label={`Category ${i + 1}`}
                  value={category}
                  onChange={(v) => update(['categories', i], v)}
                />
                <button
                  className="text-button"
                  onClick={() =>
                    update(
                      ['categories'],
                      draft.categories.filter((_, index) => index !== i),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="button button-outline"
              onClick={() => update(['categories'], [...draft.categories, 'New category'])}
            >
              Add category
            </button>
          </details>
          {draft.products.map((p, i) => (
            <details className="editor-group" key={p.id}>
              <summary>{p.name}</summary>
              <div className="editor-fields">
                {[
                  'name',
                  'brand',
                  'category',
                  'size',
                  'sku',
                  'price',
                  'priceBasis',
                  'description',
                  'image',
                ].map((key) => (
                  <EditorField
                    key={key}
                    label={`Product ${i + 1}: ${labelOf(key)}`}
                    value={p[key]}
                    onChange={(v) => update(['products', i, key], v)}
                    type={key === 'price' ? 'number' : key === 'description' ? 'textarea' : 'text'}
                    options={key === 'category' ? draft.categories : undefined}
                  />
                ))}
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={p.bestSeller}
                    onChange={(e) => update(['products', i, 'bestSeller'], e.target.checked)}
                  />
                  Show in Best sellers
                </label>
                <div>
                  <p className="small muted">
                    Image crop: {p.crop.length ? p.crop.join(', ') : 'Full image'}
                  </p>
                  {p.crop.length > 0 && (
                    <button
                      className="text-button"
                      onClick={() => update(['products', i, 'crop'], [])}
                    >
                      Use full image
                    </button>
                  )}
                </div>
              </div>
              <button
                className="text-button danger-text"
                onClick={() =>
                  update(
                    ['products'],
                    draft.products.filter((_, index) => index !== i),
                  )
                }
              >
                Remove product
              </button>
            </details>
          ))}
          <button
            className="button button-outline"
            onClick={() =>
              update(
                ['products'],
                [
                  ...draft.products,
                  {
                    ...cloneContent(defaultContent.products[0]),
                    id: `product-${Date.now()}`,
                    name: 'New product',
                    category: draft.categories[0] || '',
                    image: '/assets/logo.png',
                    crop: [],
                    price: 0,
                    bestSeller: false,
                  },
                ],
              )
            }
          >
            Add product
            <Icon name="plus" size={18} />
          </button>
        </div>
      )}
      {tab === 'Partners' && (
        <div>
          <p className="editor-help">
            Partners appear in both the homepage slider and the full directory. Use a local logo
            path or an HTTPS image URL. Brand website links are optional.
          </p>
          {draft.partners.map((p, i) => (
            <details className="editor-group" key={p.id}>
              <summary>{p.name}</summary>
              <div className="editor-fields">
                {['name', 'logo', 'website'].map((key) => (
                  <EditorField
                    key={key}
                    label={`Partner ${i + 1}: ${labelOf(key)}`}
                    value={p[key]}
                    onChange={(v) => update(['partners', i, key], v)}
                  />
                ))}
              </div>
              <button
                className="text-button danger-text"
                onClick={() =>
                  update(
                    ['partners'],
                    draft.partners.filter((_, index) => index !== i),
                  )
                }
              >
                Remove partner
              </button>
            </details>
          ))}
          <button
            className="button button-outline"
            onClick={() =>
              update(
                ['partners'],
                [
                  ...draft.partners,
                  { id: `partner-${Date.now()}`, name: 'New partner', logo: '', website: '' },
                ],
              )
            }
          >
            Add partner
            <Icon name="plus" size={18} />
          </button>
        </div>
      )}
      {tab === 'Company' && (
        <>
          <p className="editor-help">
            Contact details update the footer, contact page and enquiry links. Company registration,
            VAT and email fields stay hidden until you provide them.
          </p>
          {textGroup('contact')}
        </>
      )}
      <div className="editor-backup">
        <div>
          <h2>Keep a copy. Share the work.</h2>
          <p>
            Export your content, then replace packages/content/defaults.json and commit it to GitHub
            so your team sees the same version.
          </p>
        </div>
        <div className="backup-buttons">
          <button className="button button-outline" onClick={exportFile}>
            Export JSON
          </button>
          <button className="button button-outline" onClick={() => importInput.current.click()}>
            Import JSON
          </button>
          <input
            ref={importInput}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            aria-label="Import content JSON"
            onChange={importFile}
          />
        </div>
      </div>
      <div className="reset-area">
        {resetReady ? (
          <>
            <span>Restore the bundled defaults and discard local edits?</span>
            <button
              className="text-button danger-text"
              onClick={() => {
                try {
                  reset();
                  setDraft(cloneContent(defaultContent));
                  setResetReady(false);
                  setMessage('Defaults restored.');
                  setError('');
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Restore defaults
            </button>
            <button className="text-button" onClick={() => setResetReady(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button className="text-button" onClick={() => setResetReady(true)}>
            Reset to defaults
          </button>
        )}
      </div>
    </section>
  );
}
