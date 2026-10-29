import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import {
  COUNTRIES,
  DECLARATION_TEXT,
  DECLARATION_VERSION,
  validateProofMetadata,
  validateRegistration,
} from '@papas-choice/registration';
import {
  registrationConfigured,
  registrationLocalPreview,
  submitRegistration,
} from '../services/registration.js';

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
        maxLength={500}
        {...props}
      />
    </label>
  );
}
function Signature({ value, onChange, disabled }) {
  const canvas = useRef(null);
  const drawing = useRef(false);
  const ink = useRef(false);
  useEffect(() => {
    if (!value) return;
    const image = new Image();
    let active = true;
    image.onload = () => {
      if (active && !drawing.current) canvas.current?.getContext('2d')?.drawImage(image, 0, 0);
    };
    image.src = value;
    return () => {
      active = false;
    };
  }, [value]);
  function position(e) {
    const box = canvas.current.getBoundingClientRect();
    return [((e.clientX - box.left) * 800) / box.width, ((e.clientY - box.top) * 180) / box.height];
  }
  function start(e) {
    if (disabled) return;
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
    ink.current = true;
  }
  function finish() {
    drawing.current = false;
    if (ink.current) onChange(canvas.current.toDataURL('image/png'));
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
        onPointerUp={finish}
        onPointerCancel={finish}
        aria-label="Signature drawing area. Alternatively use the typed signature field below."
      />
      <button
        className="text-button"
        type="button"
        onClick={() => {
          canvas.current.getContext('2d').clearRect(0, 0, 800, 180);
          ink.current = false;
          onChange('');
        }}
      >
        Clear signature
      </button>
    </div>
  );
}
const steps = ['Your business', 'Delivery', 'References', 'Declaration'];
const countries = COUNTRIES;
export default function RegistrationForm({ onDone, sendRegistration = submitRegistration }) {
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
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [websiteTrap, setWebsiteTrap] = useState('');
  const inFlight = useRef(false);
  const request = useRef(null);
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
    setError('');
    form.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  async function submit(e) {
    e.preventDefault();
    if (inFlight.current || uncertain) return;
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
    if (!signatureDataUrl && !values.typedSignature?.trim()) {
      setError('Please draw or type your signature.');
      return;
    }
    if (!accepted) {
      setError('Please confirm the declaration.');
      return;
    }
    setError('');
    try {
      const registration = validateRegistration({
        values,
        differentDelivery: different,
        includeGuarantor: credit,
        signatureDataUrl,
        declarationAccepted: accepted,
        declarationVersion: DECLARATION_VERSION,
      });
      const payload = JSON.stringify(registration);
      if (
        !request.current ||
        request.current.payload !== payload ||
        request.current.proof !== proof
      ) {
        request.current = { submissionId: crypto.randomUUID(), payload, proof };
      }
      inFlight.current = true;
      setBusy(true);
      const result = await sendRegistration({
        submissionId: request.current.submissionId,
        registration,
        proof,
        websiteTrap,
        onProgress: setProgress,
      });
      onDone(result);
    } catch (failure) {
      if (['UPLOAD_EXPIRED', 'SUBMISSION_CHANGED'].includes(failure.code)) request.current = null;
      if (failure.code === 'DELIVERY_UNCONFIRMED') setUncertain(true);
      setError(failure.message || 'Your application could not be submitted. Please try again.');
    } finally {
      inFlight.current = false;
      setBusy(false);
      setProgress('');
    }
  }
  return (
    <form ref={form} onSubmit={submit} aria-busy={busy}>
      <p className="demo-note">
        <Icon name="box" size={17} />{' '}
        {registrationConfigured()
          ? registrationLocalPreview()
            ? 'Local preview only. Use sample information. No email will be sent.'
            : 'Your application and supporting document will be sent securely to our team for review.'
          : 'Online registration is not available yet. Please contact us to apply.'}
      </p>
      <div className="registration-trap" aria-hidden="true">
        <label>
          Leave this field empty
          <input
            name="company_fax_confirmation"
            value={websiteTrap}
            onChange={(e) => setWebsiteTrap(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
          />
        </label>
      </div>
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
      <fieldset className="registration-step-fields" disabled={busy || uncertain}>
        <div key={step} className="form-step">
          <p className="eyebrow">Step {step + 1} of 4</p>
          <h3>{steps[step]}</h3>
          <p className="muted form-intro">
            {
              [
                'Tell us about your business and the person we should contact.',
                'Help us understand where and how to deliver your order.',
                'Add two suppliers who know your business.',
                'Confirm your details and authorise us to review your application.',
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
                    maxLength={4000}
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
                  Choose a PDF, JPG or PNG, up to 5 MB. It will be attached to your application.
                </span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    try {
                      if (file) validateProofMetadata(file);
                      setProof(file || null);
                      setError('');
                    } catch (failure) {
                      setError(failure.message);
                      e.target.value = '';
                      setProof(null);
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
                If you are requesting credit, you can include a guarantor for our team to review.
                Any credit terms or guarantee agreement will be arranged separately.
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
              <Signature
                value={signatureDataUrl}
                onChange={setSignatureDataUrl}
                disabled={busy || uncertain}
              />
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
                {DECLARATION_TEXT}
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
      </fieldset>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {busy && (
        <p role="status" className="small">
          {progress || 'Submitting application…'}
        </p>
      )}
      {uncertain && (
        <p className="small">
          <a className="text-link" href="#/contact">
            Contact our team about this application
          </a>
        </p>
      )}
      <div className="form-actions">
        {step > 0 ? (
          <button
            type="button"
            className="button button-outline"
            disabled={busy || uncertain}
            onClick={() => navigate(step - 1)}
          >
            Back
          </button>
        ) : (
          <span className="small muted">* Required fields</span>
        )}
        <button className="button" type="submit" disabled={busy || uncertain}>
          {busy ? 'Submitting…' : step === 3 ? 'Submit application' : 'Continue'}
          <Icon name="arrow" size={17} />
        </button>
      </div>
    </form>
  );
}
