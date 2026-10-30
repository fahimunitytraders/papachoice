import { Link } from 'react-router-dom';
import { localAsset } from '@papas-choice/content';
import { useContent } from '../context/ContentContext.jsx';
import Reveal from '../components/Reveal.jsx';
import Icon from '../components/Icon.jsx';
export default function About() {
  const {
    content: { about: a },
  } = useContent();
  return (
    <>
      <section className="container about-intro">
        <Reveal>
          <p className="eyebrow">{a.eyebrow}</p>
          <h1>{a.title}</h1>
          <p className="about-lead">{a.intro}</p>
        </Reveal>
        <div className="about-scroll-cue">
          <span>Our story, in good company</span>
          <span>↓</span>
        </div>
      </section>
      <div className="container journey-grid">
        <Reveal>
          <p className="eyebrow">LONDON ROOTS</p>
          <h2>{a.journeyTitle}</h2>
          <p className="preserve-lines">{a.journeyText}</p>
        </Reveal>
        <Reveal delay={150}>
          <p className="eyebrow">A SHARED TABLE</p>
          <h2>{a.communityTitle}</h2>
          <p className="preserve-lines">{a.communityText}</p>
        </Reveal>
      </div>
      <div className="about-chapters">
        {a.sections.map((s, i) => (
          <section className={`chapter chapter-${i % 2 ? 'reverse' : 'forward'}`} key={s.id}>
            <div className="container chapter-inner">
              <Reveal className="chapter-visual">
                <div className="chapter-image">
                  <img src={localAsset(s.image)} alt={s.alt} loading="lazy" />
                </div>
              </Reveal>
              <Reveal className="chapter-copy" delay={150}>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
                <div className="chapter-rule" />
              </Reveal>
            </div>
          </section>
        ))}
      </div>
      <Reveal className="container about-end">
        <p className="eyebrow">THE NEXT CHAPTER IS YOURS</p>
        <h2>Good food brings us together.</h2>
        <Link to="/products" className="button">
          {a.button}
          <Icon name="arrow" />
        </Link>
      </Reveal>
    </>
  );
}
