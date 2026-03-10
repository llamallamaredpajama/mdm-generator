/**
 * CategoryBreakdownChart Component
 * Chart.js Doughnut chart showing gap distribution across
 * billing, medicolegal, and care categories.
 */

import { useMemo } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { Plugin } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import './CategoryBreakdownChart.css'

ChartJS.register(ArcElement, Tooltip, Legend)

interface CategoryBreakdownChartProps {
  categoryBreakdown: { billing: number; medicolegal: number; care: number }
}

// Clinical colors — hardcoded (clinical meaning)
const COLORS = {
  billing: '#dc2626',
  medicolegal: '#d97706',
  care: '#16a34a',
} as const

/** Plugin that renders total count in the doughnut center */
const centerTextPlugin: Plugin<'doughnut'> = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, width, height } = chart
    const dataset = chart.data.datasets[0]
    if (!dataset) return

    const total = (dataset.data as number[]).reduce((sum, val) => sum + val, 0)
    if (total === 0) return

    ctx.save()
    const fontSize = Math.min(width, height) / 6
    ctx.font = `700 ${fontSize}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-family') || 'system-ui, sans-serif'}`
    ctx.fillStyle = '#f1f5f9'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(total), width / 2, height / 2 - fontSize * 0.15)

    const labelSize = fontSize * 0.4
    ctx.font = `500 ${labelSize}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-family') || 'system-ui, sans-serif'}`
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('total gaps', width / 2, height / 2 + fontSize * 0.55)
    ctx.restore()
  },
}

export default function CategoryBreakdownChart({ categoryBreakdown }: CategoryBreakdownChartProps) {
  const total = categoryBreakdown.billing + categoryBreakdown.medicolegal + categoryBreakdown.care

  const chartData = useMemo(
    () => ({
      labels: ['Billing', 'Medicolegal', 'Care Quality'],
      datasets: [
        {
          data: [categoryBreakdown.billing, categoryBreakdown.medicolegal, categoryBreakdown.care],
          backgroundColor: [COLORS.billing, COLORS.medicolegal, COLORS.care],
          borderColor: 'rgba(0, 0, 0, 0.3)',
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }),
    [categoryBreakdown],
  )

  if (total === 0) {
    return (
      <div className="category-breakdown-chart">
        <h3 className="category-breakdown-chart__title">By Category</h3>
        <div className="category-breakdown-chart__empty">No gap data to display</div>
      </div>
    )
  }

  return (
    <div className="category-breakdown-chart">
      <h3 className="category-breakdown-chart__title">By Category</h3>
      <div className="category-breakdown-chart__canvas">
        <Doughnut
          data={chartData}
          plugins={[centerTextPlugin]}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#94a3b8',
                  padding: 16,
                  usePointStyle: true,
                  pointStyleWidth: 10,
                  font: { size: 12 },
                },
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                titleColor: '#f1f5f9',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 10,
              },
            },
          }}
        />
      </div>
    </div>
  )
}
