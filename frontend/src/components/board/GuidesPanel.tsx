import IntelPanel from './IntelPanel'

interface GuidesPanelProps {
  delay?: number
}

const PLACEHOLDER_GUIDELINES = [
  {
    source: 'AHA/ACC 2024',
    title: 'Acute Coronary Syndrome Pathway',
    relevance:
      'Troponin-based risk stratification recommended for chest pain with cardiac risk factors',
  },
  {
    source: 'ACEP',
    title: 'Chest Pain Clinical Policy',
    relevance: 'High-sensitivity troponin at 0 and 3 hours for intermediate risk',
  },
  {
    source: 'AHA/ASA',
    title: 'Acute Ischemic Stroke Guidelines',
    relevance: 'Door-to-needle time under 60 minutes for tPA eligibility in acute presentation',
  },
]

export default function GuidesPanel({ delay = 0 }: GuidesPanelProps) {
  return (
    <IntelPanel title="Society Guidelines" delay={delay}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PLACEHOLDER_GUIDELINES.map((g, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--color-border-primary, #222)',
              background: 'var(--color-bg-deep, #000)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: 'var(--color-accent, #e53e3e)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 4,
                fontFamily: "var(--font-mono, 'JetBrains Mono', 'SF Mono', monospace)",
              }}
            >
              {g.source}
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-text-primary, #fff)',
              }}
            >
              {g.title}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary, #999)',
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              {g.relevance}
            </div>
          </div>
        ))}
      </div>
    </IntelPanel>
  )
}
