/**
 * GapTrendChart Component
 * Chart.js Line chart showing gap trends over time, grouped by category
 * (billing, medicolegal, care). X-axis = month labels, Y-axis = gap count.
 */

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import './GapTrendChart.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface GapTrendChartProps {
  periodLabels: string[]
  periodTallies: Record<string, Record<string, number>>
  meta: Record<string, { category: string; method: string }>
  periodFilter: '3mo' | '6mo' | 'all'
}

// Clinical colors — hardcoded, not CSS variables (clinical meaning)
const CATEGORY_COLORS = {
  billing: '#dc2626',
  medicolegal: '#d97706',
  care: '#16a34a',
} as const

const CATEGORY_LABELS = {
  billing: 'Billing',
  medicolegal: 'Medicolegal',
  care: 'Care Quality',
} as const

export default function GapTrendChart({
  periodLabels,
  periodTallies,
  meta,
  periodFilter,
}: GapTrendChartProps) {
  const filteredLabels = useMemo(() => {
    if (periodFilter === 'all') return periodLabels
    const count = periodFilter === '3mo' ? 3 : 6
    return periodLabels.slice(-count)
  }, [periodLabels, periodFilter])

  const chartData = useMemo(() => {
    const categories = ['billing', 'medicolegal', 'care'] as const

    const datasets = categories.map((cat) => {
      const data = filteredLabels.map((period) => {
        const tallies = periodTallies[period] ?? {}
        let sum = 0
        for (const [gapId, count] of Object.entries(tallies)) {
          if ((meta[gapId]?.category ?? 'care') === cat) {
            sum += count
          }
        }
        return sum
      })

      return {
        label: CATEGORY_LABELS[cat],
        data,
        borderColor: CATEGORY_COLORS[cat],
        backgroundColor: `${CATEGORY_COLORS[cat]}33`,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
      }
    })

    return { labels: filteredLabels, datasets }
  }, [filteredLabels, periodTallies, meta])

  if (filteredLabels.length < 2) {
    return (
      <div className="gap-trend-chart">
        <h3 className="gap-trend-chart__title">Gap Trends</h3>
        <div className="gap-trend-chart__empty">Track encounters to see gap trends</div>
      </div>
    )
  }

  return (
    <div className="gap-trend-chart">
      <h3 className="gap-trend-chart__title">Gap Trends</h3>
      <div className="gap-trend-chart__canvas">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
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
            scales: {
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8', font: { size: 11 } },
              },
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                  color: '#94a3b8',
                  font: { size: 11 },
                  stepSize: 1,
                },
              },
            },
          }}
        />
      </div>
    </div>
  )
}
