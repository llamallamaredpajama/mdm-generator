import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'

interface IntelPanelProps {
  title: string
  children: ReactNode
  delay?: number
}

export default function IntelPanel({ title, children, delay = 0 }: IntelPanelProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <motion.div
      className="intel-panel"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        background: 'var(--color-bg-primary, #0c0c0c)',
        border: '2px solid var(--color-border-primary, #222)',
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 800,
          color: 'var(--color-text-primary, #fff)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '14px',
          paddingBottom: '10px',
          borderBottom: '1px solid var(--color-border-primary, #222)',
          fontFamily: "var(--font-family, 'Inter', sans-serif)",
        }}
      >
        {title}
      </div>
      {children}
    </motion.div>
  )
}
