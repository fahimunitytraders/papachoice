import { text } from '@papas-choice/content';
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
      <span className="field-label">
        {text('RegistrationForm.draw_signature_optional_if_typed_below')}
      </span>
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
        aria-label={text(
          'RegistrationForm.signature_drawing_area_alternatively_use_the_typed_signature_fiel',
        )}
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
        {text('RegistrationForm.clear_signature')}
      </button>
    </div>
  );
}

const countries = ['United Kingdom', 'Ireland', 'France', 'Germany', 'Netherlands', 'Other'];
export default function RegistrationForm({ onDone }) {
  const steps = [
    text('RegistrationForm.your_business'),
    text('RegistrationForm.delivery'),
    text('RegistrationForm.references'),
    text('RegistrationForm.declaration'),
  ];
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
        <span>{text('RegistrationForm.country')}</span>
        <select
          required
          value={values[`${prefix}Country`] || 'United Kingdom'}
          onChange={(e) => update(`${prefix}Country`, e.target.value)}
        >
          {countries.map((c) => (
            <option key={c} value={c}>
              {text('RegistrationForm.country_' + c.toLowerCase().replaceAll(' ', '_'))}
            </option>
          ))}
        </select>
      </label>
      {values[`${prefix}Country`] === 'Other' &&
        field(text('RegistrationForm.country_name'), `${prefix}OtherCountry`, 'text', true)}
    </div>
  );
  const address = (prefix) => (
    <>
      {field(text('RegistrationForm.street_address'), `${prefix}Address`, 'text', true)}
      {field(text('RegistrationForm.town_city'), `${prefix}City`, 'text', true)}
      {field(text('RegistrationForm.postcode'), `${prefix}Postcode`, 'text', true)}
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
      setError(text('RegistrationForm.please_choose_proof_of_your_business_address'));
      return;
    }
    if (step < 3) {
      navigate(step + 1);
      return;
    }
    if (!proof) {
      setError(text('RegistrationForm.please_choose_proof_of_your_business_address'));
      return;
    }
    if (!signed && !values.typedSignature?.trim()) {
      setError(text('RegistrationForm.please_draw_or_type_your_signature'));
      return;
    }
    if (!accepted) {
      setError(text('RegistrationForm.please_accept_the_declaration'));
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
      setError(
        err.message || text('RegistrationForm.unable_to_submit_registration_please_try_again'),
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <form ref={form} onSubmit={submit}>
      <p className="form-note">
        <Icon name="box" size={17} />
        {text('RegistrationForm.your_details_and_supporting_document_will_be_emailed_to_our_team')}
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
        <p className="eyebrow">
          {text('RegistrationForm.step')}
          {step + 1}
          {text('RegistrationForm.of_4')}
        </p>
        <h3>{steps[step]}</h3>
        <p className="muted form-intro">
          {
            [
              text('RegistrationForm.tell_us_about_your_business_and_the_person_we_should_contact'),
              text('RegistrationForm.help_us_understand_where_and_how_to_deliver_your_order'),
              text('RegistrationForm.add_two_suppliers_who_know_your_business'),
              text('RegistrationForm.confirm_your_details_and_submit_your_registration_for_review'),
            ][step]
          }
        </p>
        {step === 0 && (
          <div className="form-grid">
            {field(text('RegistrationForm.contact_full_name'), 'contactName', 'text', true)}
            {field(text('RegistrationForm.business_applicant_name'), 'businessName', 'text', true)}
            {field(text('RegistrationForm.company_registration_number'), 'companyNumber')}
            {field(text('RegistrationForm.vat_registration_number'), 'vatNumber')}
            {field(text('RegistrationForm.email_address'), 'email', 'email', true)}
            {field(text('RegistrationForm.mobile_number'), 'mobile', 'tel', true)}
            {field(text('RegistrationForm.landline_number'), 'telephone', 'tel')}
            {field(text('RegistrationForm.business_website'), 'website', 'url', false, {
              placeholder: 'https://',
            })}
            <h4 className="full-width">{text('RegistrationForm.business_address')}</h4>
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
              {text('RegistrationForm.use_a_different_delivery_address')}
            </label>
            {different ? (
              <div className="form-grid">{address('delivery')}</div>
            ) : (
              <div className="address-summary">
                {text('RegistrationForm.we_will_use_your_business_address')}
                <br />
                <strong>
                  {values.accountAddress}, {values.accountCity}, {values.accountPostcode}
                </strong>
              </div>
            )}
            <div className="form-grid">
              {field(text('RegistrationForm.parking_unloading_access'), 'parking', 'text', true, {
                placeholder: text('RegistrationForm.e_g_loading_bay_at_the_rear'),
              })}
              <label className="field">
                <span>{text('RegistrationForm.forklift_on_site')}</span>
                <select
                  required
                  value={values.forklift || ''}
                  onChange={(e) => update('forklift', e.target.value)}
                >
                  <option value="">{text('RegistrationForm.please_select')}</option>
                  <option>{text('RegistrationForm.yes')}</option>
                  <option>{text('RegistrationForm.no')}</option>
                  <option>{text('RegistrationForm.by_arrangement')}</option>
                </select>
              </label>
              <label className="field full-width">
                <span>{text('RegistrationForm.delivery_instructions_and_other_notes')}</span>
                <textarea
                  rows="4"
                  value={values.notes || ''}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder={text(
                    'RegistrationForm.opening_hours_vehicle_restrictions_or_anything_else_we_should_kno',
                  )}
                />
              </label>
            </div>
            <p className="muted small">
              {text(
                'RegistrationForm.delivery_arrangements_and_any_special_requirements_would_be_agree',
              )}
            </p>
          </>
        )}
        {step === 2 && (
          <>
            {[1, 2].map((n) => (
              <fieldset key={n}>
                <legend>
                  {text('RegistrationForm.trade_reference')}
                  {n}
                </legend>
                <div className="form-grid">
                  {field(
                    text('RegistrationForm.supplier_reference_identifier'),
                    `ref${n}Identifier`,
                  )}
                  {field(text('RegistrationForm.contact_person'), `ref${n}Name`, 'text', true)}
                  {field(
                    text('RegistrationForm.supplier_business_name'),
                    `ref${n}Company`,
                    'text',
                    true,
                  )}
                  {address(`ref${n}`)}
                </div>
              </fieldset>
            ))}
            <label className="field upload-field">
              <span>{text('RegistrationForm.proof_of_business_address')}</span>
              <span className="muted small">
                {text(
                  'RegistrationForm.choose_a_pdf_jpg_or_png_up_to_3_mb_this_document_will_be_attached',
                )}
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
                    setError(text('RegistrationForm.choose_a_pdf_jpg_or_png_smaller_than_3_mb'));
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
              {text('RegistrationForm.include_a_credit_account_guarantor')}
            </label>
            <p className="muted small">
              {text(
                'RegistrationForm.submitting_these_details_does_not_create_a_guarantee_or_credit_ag',
              )}
            </p>
            {credit && (
              <fieldset>
                <legend>{text('RegistrationForm.guarantor_information')}</legend>
                <div className="form-grid">
                  {field(
                    text('RegistrationForm.guarantor_full_name'),
                    'guarantorName',
                    'text',
                    true,
                  )}
                  {field(text('RegistrationForm.birth_date'), 'guarantorBirth', 'date', true, {
                    max: new Date().toISOString().slice(0, 10),
                  })}
                  {field(
                    text('RegistrationForm.residential_address'),
                    'guarantorAddress',
                    'text',
                    true,
                  )}
                  {field(text('RegistrationForm.contact_telephone'), 'guarantorPhone', 'tel', true)}
                  {field(text('RegistrationForm.personal_email'), 'guarantorEmail', 'email', true)}
                  {field(text('RegistrationForm.company_role'), 'guarantorPosition', 'text', true)}
                  {field(
                    text('RegistrationForm.guarantor_signature_typed'),
                    'guarantorSignature',
                    'text',
                    true,
                  )}
                  {field(
                    text('RegistrationForm.guarantor_signing_date'),
                    'guarantorDate',
                    'date',
                    true,
                  )}
                </div>
              </fieldset>
            )}
            <div className="form-grid">
              {field(text('RegistrationForm.authorised_signatory'), 'signatoryName', 'text', true)}
              {field(
                text('RegistrationForm.job_title_position'),
                'signatoryPosition',
                'text',
                true,
              )}
              {field(text('RegistrationForm.signing_date'), 'signatoryDate', 'date', true)}
            </div>
            <Signature onChange={setSigned} onImageChange={setSignatureImage} />
            {field(text('RegistrationForm.typed_signature'), 'typedSignature', 'text', false, {
              placeholder: text(
                'RegistrationForm.type_your_full_name_as_an_alternative_to_drawing',
              ),
            })}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                required
              />
              {text(
                'RegistrationForm.i_confirm_that_i_am_authorised_to_submit_these_registration_detai',
              )}
            </label>
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
            {text('RegistrationForm.back')}
          </button>
        ) : (
          <span className="small muted">{text('RegistrationForm.required_fields')}</span>
        )}
        <button className="button" type="submit" disabled={loading}>
          {loading
            ? text('RegistrationForm.submitting')
            : step === 3
              ? text('RegistrationForm.submit_registration')
              : text('RegistrationForm.continue')}
          <Icon name="arrow" size={17} />
        </button>
      </div>
    </form>
  );
}
