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
        <h3>Application submitted</h3>
        <p>
          Thank you for applying. Our team will review your application and contact you if you are
          shortlisted.
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
          setError(err.message || 'Unable to submit your application. Please try again.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <p className="form-note">
        Apply for {job.title}. Your details and CV will be emailed to our recruitment team.
      </p>
      <fieldset disabled={submitting} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="form-grid">
          <label className="field">
            <span>Full name *</span>
            <input name="name" maxLength={200} required autoComplete="name" />
          </label>
          <label className="field">
            <span>Email address *</span>
            <input name="email" maxLength={254} type="email" required autoComplete="email" />
          </label>
          <label className="field full-width">
            <span>Phone number</span>
            <input name="phone" maxLength={100} type="tel" />
          </label>
          <label className="field full-width">
            <span>A little about you *</span>
            <textarea
              name="message"
              maxLength={10000}
              required
              rows="4"
              placeholder="Tell us about your experience and why this role interests you."
            />
          </label>
          <label className="field full-width">
            <span id="career-cv-label">CV *</span>
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
                  setError('Choose a PDF no larger than 3 MB.');
                  e.target.value = '';
                } else setError('');
              }}
            />
            <span id="career-cv-help" className="small muted">
              PDF document, maximum 3 MB.
            </span>
          </label>
        </div>
        <label className="checkbox">
          <input name="consent" type="checkbox" required />I agree to my details and CV being used
          to process my application.
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button" type="submit">
          {submitting ? 'Sending application…' : 'Submit application'}
          <Icon name="arrow" size={17} />
        </button>
      </fieldset>
    </form>
  );
}
