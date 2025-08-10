type Props = {
  confirmedNoPHI: boolean
  onToggleNoPHI: () => void
  confirmedGuide: boolean
  onToggleGuide: () => void
}

export default function Checklist({ confirmedNoPHI, onToggleNoPHI, confirmedGuide, onToggleGuide }: Props) {
  return (
    <div style={{ border: '1px solid #ddd', padding: '0.75rem' }}>
      <h3>Checklist</h3>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        <input type="checkbox" checked={confirmedNoPHI} onChange={onToggleNoPHI} /> I confirm that no PHI is
        included
      </label>
      <label style={{ display: 'block' }}>
        <input type="checkbox" checked={confirmedGuide} onChange={onToggleGuide} /> I reviewed the Dictation Guide
      </label>
    </div>
  )
}

