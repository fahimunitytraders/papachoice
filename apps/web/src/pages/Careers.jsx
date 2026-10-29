import { useState } from 'react';
import { useContent } from '../context/ContentContext.jsx';
import { jobs } from '../data/jobs.js';
import Icon from '../components/Icon.jsx';
export default function Careers({ onApply }) {
  const [expanded, setExpanded] = useState(null);
  const {
    content: { careersCopy: copy },
  } = useContent();
  return (
    <section className="container page-section">
      <header className="careers-hero reveal">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <a
            href="#open-roles"
            className="button"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('open-roles')?.scrollIntoView({
                behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'auto'
                  : 'smooth',
              });
            }}
          >
            {copy.button}
            <Icon name="arrow" />
          </a>
        </div>
        <div className="careers-art" aria-hidden="true">
          <span className="art-label">A little care goes a long way.</span>
          <div className="art-box box-one">
            good
            <br />
            people.
          </div>
          <div className="art-box box-two">
            good
            <br />
            things.
          </div>
          <span className="art-bottom">GROW WITH PAPA’S CHOICE</span>
        </div>
      </header>
      <div className="culture-row">
        <div>
          <span>01</span>
          <h3>Work together</h3>
          <p>Good work starts with a team that supports one another.</p>
        </div>
        <div>
          <span>02</span>
          <h3>Care about the detail</h3>
          <p>From an account query to a packed order, the little things count.</p>
        </div>
        <div>
          <span>03</span>
          <h3>Keep growing</h3>
          <p>Bring your curiosity and build on what you do well.</p>
        </div>
      </div>
      <section id="open-roles" className="open-roles">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Find your place</p>
            <h2>
              {copy.rolesTitle} <span className="count-badge">2</span>
            </h2>
          </div>
          <span className="muted small">Finance & operations</span>
        </div>
        {jobs.map((job) => (
          <article className={`job-card ${expanded === job.id ? 'expanded' : ''}`} key={job.id}>
            <button
              className="job-toggle"
              aria-expanded={expanded === job.id}
              aria-controls={`job-${job.id}`}
              onClick={() => setExpanded(expanded === job.id ? null : job.id)}
            >
              <div>
                <span className="eyebrow">{job.team}</span>
                <h3>{job.title}</h3>
              </div>
              <span className="job-view">
                View role
                <Icon name={expanded === job.id ? 'minus' : 'plus'} />
              </span>
            </button>
            {expanded === job.id && (
              <div className="job-details" id={`job-${job.id}`}>
                <p>{job.intro}</p>
                <div className="job-columns">
                  <div>
                    <h4>What you’ll do</h4>
                    <ul>
                      {job.tasks.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>What you’ll bring</h4>
                    <ul>
                      {job.skills.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button className="button" onClick={() => onApply(job)}>
                  {copy.applyButton}
                  <Icon name="arrow" size={17} />
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
      <p className="careers-note">
        A team with different perspectives is a stronger team. We welcome applications from people
        with a wide range of backgrounds and experiences.
      </p>
    </section>
  );
}
