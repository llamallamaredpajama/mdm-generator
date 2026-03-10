/**
 * MethodBreakdownChart Component
 * Chart.js horizontal Bar chart showing gap distribution across
 * acquisition methods: History, Data Collection, Clinical Action.
 */

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import './MethodBreakdownChart.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface MethodBreakdownChartProps {
  methodBreakdown: { history: number; data_collection: number; clinical_action: number }
}

// Colors per method
const METHOD_COLORS = {
  history: '#d97706',
  data_collection: '#dc2626',
  clinical_action: '#2563eb',
} as const

const METHOD_LABELS = ['History', 'Data Collection', 'Clinical Action']

export default function MethodBreakdownChart({ methodBreakdown }: MethodBreakdownChartProps) {
  const chartData = useMemo(
    () => ({
      labels: METHOD_LABELS,
      datasets: [
        {
          data: [
            methodBreakdown.history,
            methodBreakdown.data_collection,
            methodBreakdown.clinical_action,
          ],
          backgroundColor: [
            METHOD_COLORS.history,
            METHOD_COLORS.data_collection,
            METHOD_COLORS.clinical_action,
          ],
          borderColor: 'rgba(0, 0, 0, 0.3)',
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 28,
        },
      ],
    }),
    [methodBreakdown],
  )

  return (
    <div className="method-breakdown-chart">
      <h3 className="method-breakdown-chart__title">By Acquisition Method</h3>
      <div className="method-breakdown-chart__canvas">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
              legend: { display: false },
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
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                  color: '#94a3b8',
                  font: { size: 11 },
                  stepSize: 1,
                },
              },
              y: {
                grid: { display: false },
                ticks: {
                  color: '#94a3b8',
                  font: { size: 12 },
                },
              },
            },
          }}
        />
      </div>
    </div>
  )
}
