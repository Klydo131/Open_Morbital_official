// SPDX-License-Identifier: AGPL-3.0-or-later
import { Check, ChevronRight, FilePlus2, Link, Play, X } from 'lucide-react';
import { useState } from 'react';

type Props = {
  onClose: () => void;
};

const STEPS = [
  {
    icon: <FilePlus2 size={24} />,
    title: 'Add local files',
    body: 'Use Add File to pick music or video from this device. Open Morbital keeps local files private in your browser session.',
  },
  {
    icon: <Link size={24} />,
    title: 'Paste online links',
    body: 'Paste a YouTube link in Library to stream video directly inside the player.',
  },
  {
    icon: <Play size={24} />,
    title: 'Play and switch',
    body: 'Use Player for transport controls, Library to add or search, Vault for saved ideas, and Queue for Up Next.',
  },
];

export function MobileTutorial({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const finish = () => {
    localStorage.setItem('sonata-mobile-tutorial-complete', 'yes');
    onClose();
  };

  const skip = () => {
    localStorage.setItem('sonata-mobile-tutorial-skipped', 'yes');
    onClose();
  };

  return (
    <div className="sonata-mobile-tutorial" role="dialog" aria-modal="true" aria-labelledby="sonata-mobile-tutorial-title">
      <div className="sonata-mobile-tutorial__panel">
        <button className="sonata-mobile-tutorial__skip-x" onClick={skip} aria-label="Skip tutorial">
          <X size={18} />
        </button>
        <div className="sonata-mobile-tutorial__icon">{current.icon}</div>
        <div className="sonata-mobile-tutorial__count">{step + 1} / {STEPS.length}</div>
        <h2 id="sonata-mobile-tutorial-title" className="sonata-mobile-tutorial__title">{current.title}</h2>
        <p className="sonata-mobile-tutorial__body">{current.body}</p>
        <div className="sonata-mobile-tutorial__dots" aria-hidden="true">
          {STEPS.map((_, index) => (
            <span key={index} className={index === step ? 'sonata-mobile-tutorial__dot--active' : ''} />
          ))}
        </div>
        <div className="sonata-mobile-tutorial__actions">
          <button className="sonata-btn sonata-btn--ghost sonata-btn--sm" onClick={skip}>
            Skip
          </button>
          <button
            className="sonata-btn sonata-btn--cyan sonata-btn--sm"
            onClick={() => (isLast ? finish() : setStep((value) => value + 1))}
          >
            {isLast ? <Check size={14} /> : <ChevronRight size={14} />}
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
