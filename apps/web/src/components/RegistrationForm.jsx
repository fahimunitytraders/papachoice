import { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { submitRegistration } from '../api/registration.js';

function Field({ label, name, type = 'text', required = false, value, onChange, ...props }) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <small> *</small>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        {...props}
      />
    </label>
  );
}
function Signature({ onChange, onImageChange }) {
  const canvas = useRef(null);
  const drawing = useRef(false);
  function position(e) {
    const box = canvas.current.getBoundingClientRect();
    return [((e.clientX - box.left) * 800) / box.width, ((e.clientY - box.top) * 180) / box.height];
  }
  function start(e) {
    const context = canvas.current.getContext('2d');
    drawing.current = true;
    canvas.current.setPointerCapture(e.pointerId);
    context.beginPath();
    context.moveTo(...position(e));
  }
  function move(e) {
    if (!drawing.current) return;
    const context = canvas.current.getContext('2d');
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.strokeStyle = '#302b25';
    context.lineTo(...position(e));
    context.stroke();
    onChange(true);
    onImageChange?.(canvas.current.toDataURL('image/png'));
  }
  return (
    <div className="signature">
      <span className="field-label">Draw signature (optional if typed below)</span>
      <canvas
        width="800"
        height="180"
        ref={canvas}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={() => {
          drawing.current = false;
        }}
        onPointerCancel={() => {
          drawing.current = false;
        }}
        aria-label="Signature drawing area. Alternatively use the typed signature field below."
      />
      <button
        className="text-button"
        type="button"
        onClick={() => {
          canvas.current.getContext('2d').clearRect(0, 0, 800, 180);
          onChange(false);
          onImageChange?.(null);
        }}
      >
        Clear signature
      </button>
    </div>
  );
}
const steps = ['Your business', 'Delivery', 'References', 'Declaration'];
const countries = ['United Kingdom', 'Ireland', 'France', 'Germany', 'Netherlands', 'Other'];
export default function RegistrationForm({ onDone }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    accountCountry: 'United Kingdom',
    deliveryCountry: 'United Kingdom',
    ref1Country: 'United Kingdom',
    ref2Country: 'United Kingdom',
  });
  const [different, setDifferent] = useState(false);
  const [credit, setCredit] = useState(false);
  const [proof, setProof] = useState(null);
  const [signed, setSigned] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const form = useRef(null);
  const update = (name, value) => setValues((v) => ({ ...v, [name]: value }));
  const field = (label, name, type = 'text', required = false, extra = {}) => (
    <Field
      key={name}
      label={label}
      name={name}
      type={type}
      required={required}
      value={values[name]}
      onChange={update}
      {...extra}
    />
  );
  const country = (prefix) => (
    <div className="field">
      <label className="field">
        <span>Country *</span>
        <select
          required
          value={values[`${prefix}Country`] || 'United Kingdom'}
          onChange={(e) => update(`${prefix}Country`, e.target.value)}
        >
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      {values[`${prefix}Country`] === 'Other' &&
        field('Country name', `${prefix}OtherCountry`, 'text', true)}
    </div>
  );
  const address = (prefix) => (
    <>
      {field('Street address', `${prefix}Address`, 'text', true)}
      {field('Town / city', `${prefix}City`, 'text', true)}
      {field('Postcode', `${prefix}Postcode`, 'text', true)}
      {country(prefix)}
    </>
  );
  function navigate(next) {
    setStep(next);
    setSigned(false);
    setError('');
    form.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  async function submit(e) {
    e.preventDefault();
    if (loading) return;
    if (step === 2 && !proof) {
      setError('Please choose proof of your business address.');
      return;
    }
    if (step < 3) {
      navigate(step + 1);
      return;
    }
    if (!proof) {
      setError('Please choose proof of your business address.');
      return;
    }
    if (!signed && !values.typedSignature?.trim()) {
      setError('Please draw or type your signature.');
      return;
    }
    if (!accepted) {
      setError('Please accept the declaration.');
      return;
    }

    const registrationData = {
      ...values,
      differentDeliveryAddress: different,
      creditAccountRequested: credit,
      declarationAccepted: accepted,
    };

    setLoading(true);
    setError('');
    try {
      await submitRegistration(registrationData, proof, signed ? signatureImage : null);
      onDone();
    } catch (err) {
      setError(err.message || 'Unable to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <form ref={form} onSubmit={submit}>
      <p className="demo-note">
        <Icon name="box" size={17} /> Your information and uploaded document will be emailed to our registration team. Please submit only information you are authorised to share.
      </p>
      <ol className="form-steps">
        {steps.map((name, index) => (
          <li
            key={name}
            className={index === step ? 'active' : index < step ? 'complete' : ''}
            aria-current={index === step ? 'step' : undefined}
          >
            <span>{index < step ? '✓' : index + 1}</span>
            {name}
          </li>
        ))}
      </ol>
      <div key={step} className="form-step">
        <p className="eyebrow">Step {step + 1} of 4</p>
        <h3>{steps[step]}</h3>
        <p className="muted form-intro">
          {
            [
              'Tell us about your business and the person we should contact.',
              'Help us understand where and how to deliver your order.',
              'Add two suppliers who know your business.',
              'Confirm your details and submit your registration for review.',
            ][step]
          }
        </p>
        {step === 0 && (
          <div className="form-grid">
            {field('Contact full name', 'contactName', 'text', true)}
            {field('Business / applicant name', 'businessName', 'text', true)}
            {field('Company registration number', 'companyNumber')}
            {field('VAT registration number', 'vatNumber')}
            {field('Email address', 'email', 'email', true)}
            {field('Mobile number', 'mobile', 'tel', true)}
            {field('Landline number', 'telephone', 'tel')}
            {field('Business website', 'website', 'url', false, {
              placeholder: 'https://',
            })}
            <h4 className="full-width">Business address</h4>
            {address('account')}
          </div>
        )}
        {step === 1 && (
          <>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={different}
                onChange={(e) => setDifferent(e.target.checked)}
              />
              Use a different delivery address
            </label>
            {different ? (
              <div className="form-grid">{address('delivery')}</div>
            ) : (
              <div className="address-summary">
                We will use your business address.
                <br />
                <strong>
                  {values.accountAddress}, {values.accountCity}, {values.accountPostcode}
                </strong>
              </div>
            )}
            <div className="form-grid">
              {field('Parking / unloading access', 'parking', 'text', true, {
                placeholder: 'e.g. Loading bay at the rear',
              })}
              <label className="field">
                <span>Forklift on site *</span>
                <select
                  required
                  value={values.forklift || ''}
                  onChange={(e) => update('forklift', e.target.value)}
                >
                  <option value="">Please select</option>
                  <option>Yes</option>
                  <option>No</option>
                  <option>By arrangement</option>
                </select>
              </label>
              <label className="field full-width">
                <span>Delivery instructions and other notes</span>
                <textarea
                  rows="4"
                  value={values.notes || ''}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="Opening hours, vehicle restrictions or anything else we should know."
                />
              </label>
            </div>
            <p className="muted small">
              Delivery arrangements and any special requirements would be agreed when your trade
              account is approved.
            </p>
          </>
        )}
        {step === 2 && (
          <>
            {[1, 2].map((n) => (
              <fieldset key={n}>
                <legend>Trade reference {n}</legend>
                <div className="form-grid">
                  {field('Supplier / reference identifier', `ref${n}Identifier`)}
                  {field('Contact person', `ref${n}Name`, 'text', true)}
                  {field('Supplier business name', `ref${n}Company`, 'text', true)}
                  {address(`ref${n}`)}
                </div>
              </fieldset>
            ))}
            <label className="field upload-field">
              <span>Proof of business address *</span>
              <span className="muted small">
                Choose a PDF, JPG or PNG, up to 3 MB. This document will be attached to the registration email.
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (
                    file &&
                    (file.size > 3 * 1024 * 1024 || !/\.(pdf|png|jpe?g)$/i.test(file.name))
                  ) {
                    setError('Choose a PDF, JPG or PNG smaller than 3 MB.');
                    e.target.value = '';
                    setProof(null);
                  } else {
                    setProof(file || null);
                    setError('');
                  }
                }}
              />
              {proof && <span className="file-name">{proof.name}</span>}
            </label>
          </>
        )}
        {step === 3 && (
          <>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={credit}
                onChange={(e) => setCredit(e.target.checked)}
              />
              Include a credit account guarantor
            </label>
            <p className="muted small">
              The reference form includes a personal guarantee. Submitting this information does not itself create a
              guarantee or credit agreement.
            </p>
            {credit && (
              <fieldset>
                <legend>Guarantor information</legend>
                <div className="form-grid">
                  {field('Guarantor full name', 'guarantorName', 'text', true)}
                  {field('Birth date', 'guarantorBirth', 'date', true, {
                    max: new Date().toISOString().slice(0, 10),
                  })}
                  {field('Residential address', 'guarantorAddress', 'text', true)}
                  {field('Contact telephone', 'guarantorPhone', 'tel', true)}
                  {field('Personal email', 'guarantorEmail', 'email', true)}
                  {field('Company role', 'guarantorPosition', 'text', true)}
                  {field('Guarantor signature (typed)', 'guarantorSignature', 'text', true)}
                  {field('Guarantor signing date', 'guarantorDate', 'date', true)}
                </div>
              </fieldset>
            )}
            <div className="form-grid">
              {field('Authorised signatory', 'signatoryName', 'text', true)}
              {field('Job title / position', 'signatoryPosition', 'text', true)}
              {field('Signing date', 'signatoryDate', 'date', true)}
            </div>
            <Signature onChange={setSigned} onImageChange={setSignatureImage} />
            {field('Typed signature', 'typedSignature', 'text', false, {
              placeholder: 'Type your full name as an alternative to drawing',
            })}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                required
              />
              I confirm that I am authorised to submit these registration details and the attached document for review. No account is automatically created.
            </label>
            <a
              className="small text-link"
              href="https://papachoice.co.uk/register/"
              target="_blank"
              rel="noreferrer"
            >
              View the original registration form ↗
            </a>
          </>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        {step > 0 ? (
          <button
            type="button"
            className="button button-outline"
            onClick={() => navigate(step - 1)}
          >
            Back
          </button>
        ) : (
          <span className="small muted">* Required fields</span>
        )}
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : step === 3 ? 'Submit registration' : 'Continue'}
          <Icon name="arrow" size={17} />
        </button>
      </div>
    </form>
  );
}