import { text } from '@papas-choice/content';
import { useState } from 'react';
import { useContent } from '../context/ContentContext.jsx';
import Icon from '../components/Icon.jsx';
export default function Careers({ onApply }) {
  const [expanded, setExpanded] = useState(null);
  const {
    content: { careersCopy: copy, jobs },
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
          <span className="art-label">{text('Careers.a_little_care_goes_a_long_way')}</span>
          <div className="art-box box-one">
            {text('Careers.good')}
            <br />
            {text('Careers.people')}
          </div>
          <div className="art-box box-two">
            {text('Careers.good')}
            <br />
            {text('Careers.things')}
          </div>
          <span className="art-bottom">{text('Careers.grow_with_papa_s_choice')}</span>
        </div>
      </header>
      <div className="culture-row">
        <div>
          <span>01</span>
          <h3>{text('Careers.work_together')}</h3>
          <p>{text('Careers.good_work_starts_with_a_team_that_supports_one_another')}</p>
        </div>
        <div>
          <span>02</span>
          <h3>{text('Careers.care_about_the_detail')}</h3>
          <p>{text('Careers.from_an_account_query_to_a_packed_order_the_little_things_count')}</p>
        </div>
        <div>
          <span>03</span>
          <h3>{text('Careers.keep_growing')}</h3>
          <p>{text('Careers.bring_your_curiosity_and_build_on_what_you_do_well')}</p>
        </div>
      </div>
      <section id="open-roles" className="open-roles">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{text('Careers.find_your_place')}</p>
            <h2>
              {copy.rolesTitle} <span className="count-badge">{jobs.length}</span>
            </h2>
          </div>
          <span className="muted small">{text('Careers.finance_operations')}</span>
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
                {text('Careers.view_role')}
                <Icon name={expanded === job.id ? 'minus' : 'plus'} />
              </span>
            </button>
            {expanded === job.id && (
              <div className="job-details" id={`job-${job.id}`}>
                <p>{job.intro}</p>
                <div className="job-columns">
                  <div>
                    <h4>{text('Careers.what_you_ll_do')}</h4>
                    <ul>
                      {job.tasks.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>{text('Careers.what_you_ll_bring')}</h4>
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
        {text('Careers.a_team_with_different_perspectives_is_a_stronger_team_we_welcome_')}
      </p>
    </section>
  );
}
