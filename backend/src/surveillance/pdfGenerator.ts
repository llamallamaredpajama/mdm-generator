/**
 * PDF Surveillance Trend Report Generator.
 *
 * Produces a 2-4 page PDF summarizing regional ED surveillance findings,
 * scored clinical correlations, and active alerts.
 */

import PDFDocument from 'pdfkit'
import type { TrendAnalysisResult, ClinicalCorrelation, TrendAlert } from './types'

// ── Colour palette ────────────────────────────────────────────────
const COLORS = {
  high: '#dc3545',
  moderate: '#fd7e14',
  low: '#17a2b8',
  background: '#6c757d',
  heading: '#1a1a2e',
  body: '#333333',
  muted: '#666666',
  rule: '#cccccc',
  alertCritical: '#dc3545',
  alertWarning: '#fd7e14',
  alertInfo: '#0d6efd',
} as const

const DISCLAIMER =
  'Educational tool only. All outputs require physician review before clinical use.'

// ── Helpers ───────────────────────────────────────────────────────

/** Tier colour lookup with fallback. */
function tierColor(tier: ClinicalCorrelation['tier']): string {
  return COLORS[tier] ?? COLORS.background
}

/** Alert level colour lookup with fallback. */
function alertColor(level: TrendAlert['level']): string {
  const map: Record<TrendAlert['level'], string> = {
    critical: COLORS.alertCritical,
    warning: COLORS.alertWarning,
    info: COLORS.alertInfo,
  }
  return map[level] ?? COLORS.muted
}

/** Human-readable trend label. */
function trendLabel(direction: ClinicalCorrelation['trendDirection'], magnitude?: number): string {
  const labels: Record<string, string> = {
    rising: 'Rising',
    falling: 'Falling',
    stable: 'Stable',
    unknown: 'Unknown',
  }
  const label = labels[direction] ?? 'Unknown'
  return magnitude != null ? `${label} (${magnitude > 0 ? '+' : ''}${magnitude}%)` : label
}

/** Format ISO timestamp to a readable date string. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/** Return the highest-scoring component name and value. */
function getTopComponent(f: ClinicalCorrelation): string {
  const entries: [string, number][] = [
    ['Symptom', f.components.symptomMatch],
    ['Differential', f.components.differentialMatch],
    ['Epidemiologic', f.components.epidemiologicSignal],
    ['Seasonal', f.components.seasonalPlausibility],
    ['Geographic', f.components.geographicRelevance],
  ]
  entries.sort((a, b) => b[1] - a[1])
  return `${entries[0][0]} (${entries[0][1]})`
}

// ── Page layout constants ─────────────────────────────────────────
const PAGE_MARGIN = 50
const CONTENT_WIDTH = 612 - PAGE_MARGIN * 2 // US Letter = 612pt wide
const FOOTER_Y = 720 // leave room for footer at bottom
const ROW_HEIGHT = 14 // height per table row

// ── Drawing helpers ───────────────────────────────────────────────

function drawFooter(
  doc: PDFKit.PDFDocument,
  pageNum: number,
  dataSources: string[],
): void {
  const sourcesText = `Data sources: ${dataSources.length > 0 ? dataSources.join(', ') : 'None'}`

  doc
    .save()
    .moveTo(PAGE_MARGIN, FOOTER_Y)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, FOOTER_Y)
    .strokeColor(COLORS.rule)
    .lineWidth(0.5)
    .stroke()
    .restore()

  // Use lineBreak: false on all footer text to prevent PDFKit from
  // advancing the cursor past the bottom margin and creating extra pages.
  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(COLORS.muted)
    .text(DISCLAIMER, PAGE_MARGIN, FOOTER_Y + 6, {
      width: CONTENT_WIDTH,
      align: 'left',
      lineBreak: false,
    })
    .text(sourcesText, PAGE_MARGIN, FOOTER_Y + 18, {
      width: CONTENT_WIDTH,
      align: 'left',
      lineBreak: false,
    })
    .text(`Page ${pageNum}`, PAGE_MARGIN, FOOTER_Y + 18, {
      width: CONTENT_WIDTH,
      align: 'right',
      lineBreak: false,
    })
}

function drawSectionHeading(doc: PDFKit.PDFDocument, text: string): void {
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(COLORS.heading)
    .text(text, { underline: true })
    .moveDown(0.4)
}

function hasSpace(doc: PDFKit.PDFDocument, needed: number): boolean {
  return doc.y + needed <= FOOTER_Y - 10
}

// ── Page renderers ────────────────────────────────────────────────

function renderExecutiveSummary(
  doc: PDFKit.PDFDocument,
  analysis: TrendAnalysisResult,
): void {
  // Title
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(COLORS.heading)
    .text('Regional ED Surveillance Trend Report', { align: 'center' })
    .moveDown(0.8)

  // Metadata line 1: ID and date
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.muted)
  const metaY = doc.y
  doc.text(`Analysis ID: ${analysis.analysisId}`, PAGE_MARGIN, metaY, { width: CONTENT_WIDTH / 2 })
  doc.text(`Date: ${formatDate(analysis.analyzedAt)}`, PAGE_MARGIN + CONTENT_WIDTH / 2, metaY, {
    width: CONTENT_WIDTH / 2,
    align: 'right',
  })

  // Metadata line 2: Region
  doc.text(`Region: ${analysis.regionLabel}`, PAGE_MARGIN, metaY + 14)
  doc.moveDown(0.8)

  // Summary
  drawSectionHeading(doc, 'Summary')
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.body)
    .text(analysis.summary, { width: CONTENT_WIDTH, lineGap: 2 })
    .moveDown(1)

  // Top findings table
  if (analysis.rankedFindings.length > 0) {
    drawSectionHeading(doc, 'Top Findings')
    renderFindingsTable(doc, analysis.rankedFindings)
  } else {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text('No ranked findings for this analysis period.')
      .moveDown(0.5)
  }
}

function renderFindingsTable(
  doc: PDFKit.PDFDocument,
  findings: ClinicalCorrelation[],
): void {
  // Column layout: absolute x offsets from PAGE_MARGIN
  const cols = [
    { header: 'Condition', x: 0, w: 170 },
    { header: 'Score', x: 170, w: 50 },
    { header: 'Tier', x: 220, w: 75 },
    { header: 'Trend', x: 295, w: 105 },
    { header: 'Top Component', x: 400, w: 112 },
  ]

  // Header row
  const headerY = doc.y
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.heading)
  for (const col of cols) {
    doc.text(col.header, PAGE_MARGIN + col.x, headerY, { width: col.w })
  }

  // Move past the header
  doc.y = headerY + ROW_HEIGHT + 2

  // Divider
  doc
    .save()
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y)
    .strokeColor(COLORS.rule)
    .lineWidth(0.5)
    .stroke()
    .restore()

  doc.y += 4

  // Data rows
  for (const f of findings) {
    if (!hasSpace(doc, ROW_HEIGHT + 4)) break

    const rowY = doc.y
    doc.font('Helvetica').fontSize(9)

    doc.fillColor(COLORS.body).text(f.condition, PAGE_MARGIN + cols[0].x, rowY, { width: cols[0].w })
    doc.fillColor(COLORS.body).text(String(f.overallScore), PAGE_MARGIN + cols[1].x, rowY, { width: cols[1].w })
    doc.fillColor(tierColor(f.tier)).text(f.tier.toUpperCase(), PAGE_MARGIN + cols[2].x, rowY, { width: cols[2].w })
    doc.fillColor(COLORS.body).text(
      trendLabel(f.trendDirection, f.trendMagnitude),
      PAGE_MARGIN + cols[3].x,
      rowY,
      { width: cols[3].w },
    )
    doc.fillColor(COLORS.body).text(getTopComponent(f), PAGE_MARGIN + cols[4].x, rowY, { width: cols[4].w })

    doc.y = rowY + ROW_HEIGHT + 2
  }
}

function renderDetailedFindings(
  doc: PDFKit.PDFDocument,
  findings: ClinicalCorrelation[],
): void {
  drawSectionHeading(doc, 'Detailed Findings')

  if (findings.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text('No findings to display.')
      .moveDown(0.5)
    return
  }

  for (const f of findings) {
    if (!hasSpace(doc, 100)) break

    // Condition header
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(tierColor(f.tier))
      .text(`${f.condition}  —  ${f.tier.toUpperCase()}  (Score: ${f.overallScore})`)
      .moveDown(0.2)

    // Trend
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.body)
      .text(`Trend: ${trendLabel(f.trendDirection, f.trendMagnitude)}`)
      .moveDown(0.2)

    // Scoring component breakdown
    const components = [
      { label: 'Symptom Match', value: f.components.symptomMatch, max: 40 },
      { label: 'Differential Match', value: f.components.differentialMatch, max: 20 },
      { label: 'Epidemiologic Signal', value: f.components.epidemiologicSignal, max: 25 },
      { label: 'Seasonal Plausibility', value: f.components.seasonalPlausibility, max: 10 },
      { label: 'Geographic Relevance', value: f.components.geographicRelevance, max: 5 },
    ]

    for (const c of components) {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(`  ${c.label}: ${c.value} / ${c.max}`)
    }
    doc.moveDown(0.2)

    // Summary
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.body)
      .text(f.summary, { width: CONTENT_WIDTH, lineGap: 1 })
      .moveDown(0.6)

    // Separator
    doc
      .save()
      .moveTo(PAGE_MARGIN, doc.y)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y)
      .strokeColor(COLORS.rule)
      .lineWidth(0.25)
      .stroke()
      .restore()
      .moveDown(0.4)
  }
}

function renderAlerts(
  doc: PDFKit.PDFDocument,
  alerts: TrendAlert[],
): void {
  drawSectionHeading(doc, 'Alerts')

  if (alerts.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text('No alerts for this analysis period.')
      .moveDown(0.5)
    return
  }

  for (const alert of alerts) {
    if (!hasSpace(doc, 50)) break

    const levelTag = alert.level.toUpperCase()

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(alertColor(alert.level))
      .text(`[${levelTag}]  ${alert.title}`)
      .moveDown(0.15)

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.body)
      .text(alert.description, { width: CONTENT_WIDTH, lineGap: 1 })

    if (alert.condition) {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(`Related condition: ${alert.condition}`)
    }

    doc.moveDown(0.6)
  }
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Generate a multi-page PDF surveillance trend report.
 *
 * @param analysis - The complete trend analysis result.
 * @returns Buffer containing the PDF document bytes.
 */
export async function generateTrendReport(
  analysis: TrendAnalysisResult,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Uint8Array[] = []

    const doc = new PDFDocument({
      size: 'LETTER',
      compress: false,
      margins: { top: PAGE_MARGIN, bottom: 0, left: PAGE_MARGIN, right: PAGE_MARGIN },
      bufferPages: true,
      info: {
        Title: 'Regional ED Surveillance Trend Report',
        Author: 'MDM Generator — Surveillance Module',
        Subject: `Analysis ${analysis.analysisId}`,
      },
    })

    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // ── Page 1: Executive Summary ──────────────────────────────
    renderExecutiveSummary(doc, analysis)

    // ── Page 2: Detailed Findings ──────────────────────────────
    doc.addPage()
    renderDetailedFindings(doc, analysis.rankedFindings)

    // ── Page 3 (conditional): Alerts ───────────────────────────
    if (analysis.alerts.length > 0) {
      doc.addPage()
      renderAlerts(doc, analysis.alerts)
    }

    // ── Draw footers on every page ─────────────────────────────
    const pageCount = doc.bufferedPageRange().count
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i)
      drawFooter(doc, i + 1, analysis.dataSourcesQueried)
    }

    doc.end()
  })
}
