import { text } from '@papas-choice/content';
import { useState } from 'react';
import { submitApplication } from '../api/careers.js';
import Icon from './Icon.jsx';
export default function ApplicationForm({ job }) {
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (complete)
    return (
      <div className="empty-state" role="status">
        <Icon name="check" size={40} />
        <h3>{text('ApplicationForm.application_submitted')}</h3>
        <p>
          {text(
            'ApplicationForm.thank_you_for_applying_our_team_will_review_your_application_and_',
          )}
        </p>
      </div>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting) return;
        const data = new FormData(e.currentTarget);
        const cv = e.currentTarget.elements.cv.files?.[0];
        setError('');
        setSubmitting(true);
        try {
          await submitApplication(
            {
              jobId: job.id,
              name: data.get('name'),
              email: data.get('email'),
              phone: data.get('phone'),
              message: data.get('message'),
              consent: data.get('consent') === 'on',
            },
            cv,
          );
          setComplete(true);
        } catch (err) {
          setError(
            err.message ||
              text('ApplicationForm.unable_to_submit_your_application_please_try_again'),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <p className="form-note">
        {text('ApplicationForm.apply_for')}
        {job.title}
        {text('ApplicationForm.your_details_and_cv_will_be_emailed_to_our_recruitment_team')}
      </p>
      <fieldset disabled={submitting} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="form-grid">
          <label className="field">
            <span>{text('ApplicationForm.full_name')}</span>
            <input name="name" maxLength={200} required autoComplete="name" />
          </label>
          <label className="field">
            <span>{text('ApplicationForm.email_address')}</span>
            <input name="email" maxLength={254} type="email" required autoComplete="email" />
          </label>
          <label className="field full-width">
            <span>{text('ApplicationForm.phone_number')}</span>
            <input name="phone" maxLength={100} type="tel" />
          </label>
          <label className="field full-width">
            <span>{text('ApplicationForm.a_little_about_you')}</span>
            <textarea
              name="message"
              maxLength={10000}
              required
              rows="4"
              placeholder={text(
                'ApplicationForm.tell_us_about_your_experience_and_why_this_role_interests_you',
              )}
            />
          </label>
          <label className="field full-width">
            <span id="career-cv-label">{text('ApplicationForm.cv')}</span>
            <input
              name="cv"
              aria-labelledby="career-cv-label"
              aria-describedby="career-cv-help"
              type="file"
              accept=".pdf"
              required
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && (file.size > 3 * 1024 * 1024 || !/\.pdf$/i.test(file.name))) {
                  setError(text('ApplicationForm.choose_a_pdf_no_larger_than_3_mb'));
                  e.target.value = '';
                } else setError('');
              }}
            />
            <span id="career-cv-help" className="small muted">
              {text('ApplicationForm.pdf_document_maximum_3_mb')}
            </span>
          </label>
        </div>
        <label className="checkbox">
          <input name="consent" type="checkbox" required />
          {text(
            'ApplicationForm.i_agree_to_my_details_and_cv_being_used_to_process_my_application',
          )}
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button" type="submit">
          {submitting
            ? text('ApplicationForm.sending_application')
            : text('ApplicationForm.submit_application')}
          <Icon name="arrow" size={17} />
        </button>
      </fieldset>
    </form>
  );
}
