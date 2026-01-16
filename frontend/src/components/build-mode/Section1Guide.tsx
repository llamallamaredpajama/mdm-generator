import { useState } from 'react';

interface GuideSection {
  title: string;
  prompts: string[];
}

const guideSections: GuideSection[] = [
  {
    title: 'Patient Demographics',
    prompts: [
      'Age and sex',
      'Chief complaint in patient\'s words',
      'Arrival mode (ambulance, walk-in, transfer)',
    ],
  },
  {
    title: 'History of Present Illness (HPI)',
    prompts: [
      'Onset - When did this start? Sudden or gradual?',
      'Duration - How long has this been going on?',
      'Character - Describe the symptom (sharp, dull, pressure, etc.)',
      'Location - Where exactly? Does it radiate?',
      'Severity - Scale 1-10? Worst ever?',
      'Associated symptoms - What else are you experiencing?',
      'Timing - Constant or intermittent? What makes it better/worse?',
      'Context - What were you doing when it started?',
    ],
  },
  {
    title: 'Physical Exam Findings',
    prompts: [
      'General appearance (toxic, well-appearing, distressed)',
      'Vital signs (and if abnormal, your concern level)',
      'Pertinent positives - What abnormal findings support your differential?',
      'Pertinent negatives - What expected findings are notably absent?',
      'Focused exam findings relevant to chief complaint',
    ],
  },
  {
    title: 'Risk Factors',
    prompts: [
      'Past medical history - especially relevant conditions',
      'Surgical history - prior procedures',
      'Current medications - including recent changes',
      'Allergies - medication and other',
      'Social history - smoking, alcohol, drugs, living situation',
      'Family history - relevant hereditary conditions',
    ],
  },
  {
    title: 'Initial Clinical Impression',
    prompts: [
      'What are you most worried about? (worst-first thinking)',
      'What life-threatening diagnoses must be ruled out?',
      'What is your leading diagnosis and why?',
      'What alternative diagnoses are you considering?',
    ],
  },
];

export function Section1Guide() {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0, 1, 4]) // Start with Demographics, HPI, and Impression expanded
  );

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(guideSections.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="section-guide">
      <div className="guide-header">
        <h4>Section 1: Initial Evaluation Guide</h4>
        <div className="guide-controls">
          <button type="button" onClick={expandAll} className="guide-control-btn">
            Expand All
          </button>
          <button type="button" onClick={collapseAll} className="guide-control-btn">
            Collapse All
          </button>
        </div>
      </div>
      <p className="guide-description">
        Document your initial assessment. Focus on what you&apos;re most worried about.
      </p>
      <div className="guide-sections">
        {guideSections.map((section, index) => (
          <div key={section.title} className="guide-section">
            <button
              type="button"
              className="guide-section-header"
              onClick={() => toggleSection(index)}
              aria-expanded={expandedSections.has(index)}
            >
              <span className="guide-section-icon">
                {expandedSections.has(index) ? '▼' : '▶'}
              </span>
              <span className="guide-section-title">{section.title}</span>
            </button>
            {expandedSections.has(index) && (
              <ul className="guide-prompts">
                {section.prompts.map((prompt) => (
                  <li key={prompt} className="guide-prompt">
                    {prompt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Section1Guide;
