import { useState } from 'react';

interface GuideSection {
  title: string;
  prompts: string[];
}

const guideSections: GuideSection[] = [
  {
    title: 'Laboratory Studies',
    prompts: [
      'CBC - WBC, Hgb, platelets and clinical significance',
      'BMP/CMP - electrolytes, renal function, glucose',
      'Cardiac markers - troponin, BNP if obtained',
      'Coagulation studies - PT/INR, PTT if relevant',
      'Urinalysis - findings and interpretation',
      'Other labs - lactate, liver enzymes, lipase, etc.',
      'Pertinent negative lab findings',
    ],
  },
  {
    title: 'Imaging Studies',
    prompts: [
      'X-rays ordered and findings',
      'CT scans - indication, contrast, key findings',
      'Ultrasound - bedside or formal, findings',
      'MRI if obtained - indication and findings',
      'Comparison to prior imaging if available',
      'Radiologist interpretation vs your read',
    ],
  },
  {
    title: 'EKG Findings',
    prompts: [
      'Rate and rhythm',
      'Intervals (PR, QRS, QTc)',
      'Axis',
      'ST/T wave changes',
      'Comparison to prior EKG if available',
      'Clinical interpretation and significance',
    ],
  },
  {
    title: 'Clinical Decision Rules',
    prompts: [
      'HEART score - for chest pain risk stratification',
      'NEXUS/Canadian C-spine - for cervical spine clearance',
      'PECARN - for pediatric head injury',
      'Wells criteria - for PE/DVT probability',
      'Ottawa ankle/knee rules - for fracture imaging',
      'PERC rule - for PE rule-out',
      'Other applicable decision rules and scores',
    ],
  },
  {
    title: 'Working Diagnosis',
    prompts: [
      'Primary diagnosis based on workup results',
      'How did results change your differential?',
      'What diagnoses were ruled out and how?',
      'Remaining diagnostic uncertainty',
      'Additional workup needed (if any)',
    ],
  },
];

export function Section2Guide() {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0, 1, 4]) // Start with Labs, Imaging, and Working Diagnosis expanded
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
        <h4>Section 2: Workup &amp; Results Guide</h4>
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
        Document your diagnostic workup and how results inform your diagnosis.
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

export default Section2Guide;
