import { useTrendAnalysisContext } from '../../contexts/TrendAnalysisContext'
import type { TrendAnalysisResult } from '../../types/surveillance'
import IntelPanel from './IntelPanel'

interface SurveillancePanelProps {
  trendAnalysis?: TrendAnalysisResult
  delay?: number
}

/** Map tier to display style */
function getTierStyle(tier: string): { color: string; border: string; icon: string } {
  switch (tier) {
    case 'high':
      return {
        color: 'var(--color-accent, #e53e3e)',
        border: 'rgba(229, 62, 62, 0.3)',
        icon: '\u25B2', // ▲
      }
    case 'moderate':
      return {
        color: 'var(--color-warning, #d97706)',
        border: 'rgba(217, 119, 6, 0.3)',
        icon: '\u25B2', // ▲
      }
    case 'low':
      return {
        color: 'var(--color-text-secondary, #999)',
        border: 'var(--color-border-primary, #222)',
        icon: '\u2015', // ―
      }
    default:
      return {
        color: 'var(--color-text-muted, #555)',
        border: 'var(--color-border-primary, #222)',
        icon: '\u2713', // ✓
      }
  }
}

export default function SurveillancePanel({ trendAnalysis, delay = 0 }: SurveillancePanelProps) {
  const { isEnabled, lastAnalysis } = useTrendAnalysisContext()
  // Prefer persisted trendAnalysis from Firestore, fall back to in-memory context
  const analysis = trendAnalysis || lastAnalysis

  return (
    <IntelPanel title="Regional Surveillance" delay={delay}>
      {!isEnabled ? (
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
          Enable surveillance in Settings to see regional trends
        </div>
      ) : !analysis ? (
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
          No surveillance data available
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Region label */}
          {analysis.regionLabel && (
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: 'var(--color-text-secondary, #999)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: "var(--font-mono, 'JetBrains Mono', 'SF Mono', monospace)",
                marginBottom: 4,
              }}
            >
              {analysis.regionLabel}
            </div>
          )}

          {/* Alerts first */}
          {analysis.alerts.map((alert, i) => {
            const isElevated = alert.level === 'critical' || alert.level === 'warning'
            return (
              <div
                key={`alert-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  border: `1px solid ${isElevated ? 'rgba(229, 62, 62, 0.3)' : 'var(--color-border-primary, #222)'}`,
                  background: 'var(--color-bg-deep, #000)',
                }}
              >
                <span
                  style={{
                    fontSize: '16px',
                    color: isElevated
                      ? 'var(--color-accent, #e53e3e)'
                      : 'var(--color-text-secondary, #999)',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {alert.level === 'critical'
                    ? '\u25B2'
                    : alert.level === 'warning'
                      ? '\u25B2'
                      : '\u2139'}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isElevated
                        ? 'var(--color-accent, #e53e3e)'
                        : 'var(--color-text-primary, #fff)',
                    }}
                  >
                    {alert.title}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary, #999)',
                      marginTop: 2,
                    }}
                  >
                    {alert.description}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Ranked findings */}
          {analysis.rankedFindings.map((finding, i) => {
            const style = getTierStyle(finding.tier)
            return (
              <div
                key={`finding-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  border: `1px solid ${style.border}`,
                  background: 'var(--color-bg-deep, #000)',
                }}
              >
                <span
                  style={{
                    fontSize: '16px',
                    color: style.color,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {style.icon}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color:
                        finding.tier === 'high'
                          ? 'var(--color-accent, #e53e3e)'
                          : 'var(--color-text-primary, #fff)',
                    }}
                  >
                    {finding.condition}
                    {finding.trendDirection === 'rising' && ' \u2014 Rising'}
                    {finding.trendDirection === 'falling' && ' \u2014 Falling'}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary, #999)',
                      marginTop: 2,
                    }}
                  >
                    {finding.summary}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Fallback if no alerts or findings */}
          {analysis.alerts.length === 0 && analysis.rankedFindings.length === 0 && (
            <div
              style={{
                padding: '12px',
                fontSize: '13px',
                color: 'var(--color-text-secondary, #999)',
                lineHeight: 1.5,
              }}
            >
              {analysis.summary || 'No notable regional trends detected'}
            </div>
          )}
        </div>
      )}
    </IntelPanel>
  )
}
