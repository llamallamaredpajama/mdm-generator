import type { SocietyGuideline } from '../../types/encounter'
import IntelPanel from './IntelPanel'

interface GuidesPanelProps {
  guidelines?: SocietyGuideline[]
  delay?: number
}

export default function GuidesPanel({ guidelines, delay = 0 }: GuidesPanelProps) {
  return (
    <IntelPanel title="Society Guidelines" delay={delay}>
      {!guidelines || guidelines.length === 0 ? (
        <div
          style={{
            padding: '16px 12px',
            border: '1px dashed var(--color-border-primary, #222)',
            textAlign: 'center',
            color: 'var(--color-text-muted, #555)',
            fontSize: '12px',
            fontFamily: "var(--font-mono, 'JetBrains Mono', 'SF Mono', monospace)",
            letterSpacing: '0.05em',
          }}
        >
          No society guidelines identified
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {guidelines.map((g, i) => (
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
      )}
    </IntelPanel>
  )
}
