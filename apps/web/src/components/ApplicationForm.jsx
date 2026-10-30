import { useState } from 'react';
import Icon from './Icon.jsx';
export default function ApplicationForm() {
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  if (complete)
    return (
      <div className="empty-state" role="status">
        <Icon name="check" size={40} />
        <h3>Application preview</h3>
        <p>Your application has not been submitted.</p>
      </div>
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!error) setComplete(true);
      }}
    >
      <p className="form-note">Online applications are not available yet.</p>
      <div className="form-grid">
        <label className="field">
          <span>Full name *</span>
          <input name="name" required autoComplete="name" />
        </label>
        <label className="field">
          <span>Email address *</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="field full-width">
          <span>Phone number</span>
          <input name="phone" type="tel" />
        </label>
        <label className="field full-width">
          <span>A little about you *</span>
          <textarea
            name="message"
            required
            rows="4"
            placeholder="Tell us about your experience and why this role interests you."
          />
        </label>
        <label className="field full-width">
          <span>CV *</span>
          <input
            name="cv"
            type="file"
            accept=".pdf,.doc,.docx"
            required
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && (file.size > 5 * 1024 * 1024 || !/\.(pdf|docx?)$/i.test(file.name))) {
                setError('Choose a PDF, DOC or DOCX smaller than 5 MB.');
                e.target.value = '';
              } else setError('');
            }}
          />
          <span className="small muted">PDF or Word document, maximum 5 MB.</span>
        </label>
      </div>
      <label className="checkbox">
        <input type="checkbox" required />I understand this form does not submit an application.
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button className="button" type="submit">
        Preview application
        <Icon name="arrow" size={17} />
      </button>
    </form>
  );
}
