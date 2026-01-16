import { useState } from 'react';

interface GuideSection {
  title: string;
  prompts: string[];
}

const guideSections: GuideSection[] = [
  {
    title: 'Medications Administered',
    prompts: [
      'Pain management - medication, dose, route, response',
      'Antibiotics - indication, choice rationale',
      'Antiemetics, fluids, or other supportive care',
      'Condition-specific medications',
      'Patient response to treatments',
    ],
  },
  {
    title: 'Procedures Performed',
    prompts: [
      'Procedure name and indication',
      'Technique and approach',
      'Complications or difficulties',
      'Results/findings from procedure',
      'Patient tolerance',
    ],
  },
  {
    title: 'Response to Treatment',
    prompts: [
      'Symptom improvement or persistence',
      'Vital sign changes after treatment',
      'Pain score changes',
      'Functional status (able to ambulate, tolerate PO, etc.)',
      'Any adverse reactions',
    ],
  },
  {
    title: 'Consultations',
    prompts: [
      'Specialty consulted and reason',
      'Consultant recommendations',
      'Admission vs observation vs discharge recommendation',
      'Follow-up arrangements made',
      'Disagreements with consultant (if any) and resolution',
    ],
  },
  {
    title: 'Disposition Decision',
    prompts: [
      'Disposition: Admit / Observe / Discharge / Transfer / AMA',
      'Rationale for disposition decision',
      'Level of care if admitting (floor, tele, ICU)',
      'Admitting service and accepting physician',
      'Why safe for discharge (if applicable)',
      'Red flags discussed with patient',
    ],
  },
  {
    title: 'Discharge Instructions (if applicable)',
    prompts: [
      'Diagnosis explained in patient terms',
      'Medications prescribed - new and changes',
      'Activity restrictions',
      'Return precautions - specific symptoms to watch for',
      'Follow-up appointments arranged',
      'Patient understanding confirmed',
      'Who is accompanying patient home',
    ],
  },
];

export function Section3Guide() {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0, 4, 5]) // Start with Medications, Disposition, and Discharge expanded
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
        <h4>Section 3: Treatment &amp; Disposition Guide</h4>
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
        Document your treatment decisions and final disposition with rationale.
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

export default Section3Guide;
