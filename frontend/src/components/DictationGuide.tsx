export default function DictationGuide() {
  return (
    <div style={{ border: '1px solid #ddd', padding: '0.75rem', marginBottom: '1rem' }}>
      <h3>Dictation Guide</h3>
      <p>
        Use this guide to ensure completeness before generating. Updated guide is stored under
        <code>docs/mdm-gen-guide.md</code>. We will wire the backend prompt to this content.
      </p>
      <ul>
        <li>Chief complaint and context</li>
        <li>Worst-first consideration and red flags</li>
        <li>Differential diagnoses</li>
        <li>Data reviewed/ordered (labs, imaging, consults)</li>
        <li>Clinical decision making and risk</li>
        <li>Dispo and follow-up</li>
      </ul>
    </div>
  )
}

