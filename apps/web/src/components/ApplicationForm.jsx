import { useState } from 'react';
import Icon from './Icon.jsx';
export default function ApplicationForm({ job }) {
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  if (complete)
    return (
      <div className="empty-state" role="status">
        <Icon name="check" size={40} />
        <h3>Demo application complete</h3>
        <p>No application was sent. Your details and CV have not been saved.</p>
      </div>
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!error) setComplete(true);
      }}
    >
      <p className="demo-note">
        Demo application for {job.title}. Use sample information; nothing is sent or saved.
      </p>
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
          <span className="small muted">Sample file only. PDF or Word document, maximum 5 MB.</span>
        </label>
      </div>
      <label className="checkbox">
        <input type="checkbox" required />I understand this is a demonstration application.
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button className="button" type="submit">
        Complete demo application
        <Icon name="arrow" size={17} />
      </button>
    </form>
  );
}
