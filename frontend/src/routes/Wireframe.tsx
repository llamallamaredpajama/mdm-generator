/* eslint-disable */
// @ts-nocheck — Untyped prototype, will be deleted in Wave 3
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── BRUTALIST DESIGN TOKENS ─── */
const C = {
  black: '#000000',
  bg: '#0c0c0c',
  card: '#0c0c0c',
  border: '#222222',
  white: '#ffffff',
  text: '#ffffff',
  sec: '#999999',
  ter: '#555555',
  mute: '#333333',
  red: '#e53e3e',
  redFaint: 'rgba(229,62,62,0.1)',
  redBord: 'rgba(229,62,62,0.25)',
  dim: 'rgba(0,0,0,0.85)',
  font: "'Inter', -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
}

/* ─── 4 COLUMNS STATUS ─── */
const STATUS = {
  NEW: { label: 'NEW', order: 0 },
  COMPOSING: { label: 'COMPOSING', order: 1 },
  BUILDING: { label: 'BUILDING', order: 2 },
  COMPLETE: { label: 'COMPLETE', order: 3 },
}

const STATUS_KEYS = Object.keys(STATUS)

/* ─── EDITORIAL PHOTOS ─── */
const CARD_PHOTOS = {
  'Chest Pain': './encounter-photos/chest-pain.png',
  'Abdominal Pain': './encounter-photos/abdominal-pain.png',
  'Shortness Breath': './encounter-photos/shortness-breath.png',
  'Head Injury': './encounter-photos/head-injury.png',
  'Back Pain': './encounter-photos/back-pain.png',
  'Fever Cough': './encounter-photos/fever-cough.png',
  'Laceration Hand': './encounter-photos/laceration-hand.png',
  'Altered Mental': './encounter-photos/altered-mental.png',
  'Ankle Injury': './encounter-photos/ankle-injury.png',
  'Syncope Episode': './encounter-photos/syncope.png',
  'Allergic Reaction': './encounter-photos/allergic-reaction.png',
  'Flank Pain': './encounter-photos/flank-pain.png',
}

const DEFAULT_PHOTO = './encounter-photos/default.png'

function getPhoto(cc) {
  return CARD_PHOTOS[cc] || DEFAULT_PHOTO
}

/* ─── DATA ─── */
const CHIEF_COMPLAINTS = [
  'Chest Pain',
  'Abdominal Pain',
  'Shortness Breath',
  'Head Injury',
  'Back Pain',
  'Fever Cough',
  'Laceration Hand',
  'Altered Mental',
  'Ankle Injury',
  'Syncope Episode',
  'Allergic Reaction',
  'Flank Pain',
]

const MOCK_ENCOUNTERS = [
  {
    id: 1,
    room: 'T1',
    age: 68,
    sex: 'M',
    cc: 'Chest Pain',
    status: 'BUILDING',
    acuity: 2,
    narrative:
      '68-year-old male presenting with acute onset substernal chest pain radiating to left arm...',
  },
  {
    id: 2,
    room: '4',
    age: 34,
    sex: 'F',
    cc: 'Abdominal Pain',
    status: 'COMPOSING',
    acuity: 3,
    narrative: '',
  },
  { id: 3, room: '7', age: 45, sex: 'M', cc: 'Back Pain', status: 'NEW', acuity: 4, narrative: '' },
  {
    id: 4,
    room: '12',
    age: 22,
    sex: 'F',
    cc: 'Ankle Injury',
    status: 'COMPLETE',
    acuity: 4,
    narrative: '22-year-old female with inversion injury to right ankle...',
  },
  {
    id: 5,
    room: 'T3',
    age: 71,
    sex: 'F',
    cc: 'Shortness Breath',
    status: 'BUILDING',
    acuity: 2,
    narrative: '71-year-old female with progressive dyspnea...',
  },
  {
    id: 6,
    room: '9',
    age: 8,
    sex: 'M',
    cc: 'Fever Cough',
    status: 'NEW',
    acuity: 3,
    narrative: '',
  },
]

const DECISION_RULES = [
  {
    name: 'HEART Score',
    score: '7/10',
    risk: 'High',
    recommendation: 'Admit for serial troponins, cardiology consult',
    icon: '♥',
  },
  {
    name: 'PERC Rule',
    result: 'Not satisfied',
    detail: 'Age >50, HR pending, troponin pending',
    icon: '◉',
  },
  {
    name: 'Wells Criteria',
    score: '2.0',
    risk: 'Moderate',
    recommendation: 'Consider D-dimer or CTA',
    icon: '△',
  },
]

const GUIDELINES = [
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
]

const SURVEILLANCE = [
  {
    type: 'alert',
    level: 'elevated',
    title: 'RSV Activity — Elevated',
    detail: 'Travis County positivity rate 18.2%, above seasonal baseline',
    icon: '▲',
  },
  {
    type: 'info',
    level: 'normal',
    title: 'Influenza A/B',
    detail: 'Within expected range for region',
    icon: '―',
  },
  {
    type: 'clear',
    level: 'none',
    title: 'Bioterrorism Alerts',
    detail: 'No active alerts for Central Texas region',
    icon: '✓',
  },
]

/* ─── SIDEBAR NAV ─── */
function SideNav({ active, onNav, counts, onAdd }) {
  const items = [
    { id: 'board', icon: '▦', label: 'Board' },
    { id: 'encounters', icon: '☰', label: 'Encounters' },
    { id: 'analytics', icon: '↗', label: 'Analytics' },
  ]
  const bottom = [
    { id: 'help', icon: '?', label: 'Help' },
    { id: 'settings', icon: '⚙', label: 'Settings' },
  ]

  return (
    <div
      style={{
        width: 180,
        minWidth: 180,
        background: C.black,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        borderRight: `1px solid ${C.border}`,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '0 24px 32px',
          fontSize: 18,
          fontWeight: 900,
          color: C.white,
          letterSpacing: '-0.04em',
          textTransform: 'uppercase',
        }}
      >
        Encounter
      </div>

      {/* Nav */}
      <div style={{ flex: 1 }}>
        {items.map((it) => (
          <div
            key={it.id}
            onClick={() => onNav(it.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 24px',
              cursor: 'pointer',
              color: active === it.id ? C.white : C.sec,
              fontWeight: active === it.id ? 600 : 500,
              fontSize: 14,
              background: active === it.id ? 'rgba(255,255,255,0.06)' : 'transparent',
              borderRight: active === it.id ? '2px solid ' + C.white : '2px solid transparent',
              transition: 'all 0.1s',
            }}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center', fontFamily: C.mono }}>
              {it.icon}
            </span>
            {it.label}
          </div>
        ))}

        <div style={{ padding: '16px 16px 0' }}>
          <button
            onClick={onAdd}
            style={{
              width: '100%',
              padding: '9px 0',
              border: `1px dashed ${C.mute}`,
              borderRadius: 6,
              background: 'transparent',
              color: C.ter,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: C.font,
              transition: 'all 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.sec
              e.currentTarget.style.color = C.sec
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.mute
              e.currentTarget.style.color = C.ter
            }}
          >
            + New
          </button>
        </div>
      </div>

      {/* Bottom */}
      <div>
        {bottom.map((it) => (
          <div
            key={it.id}
            onClick={() => onNav(it.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 24px',
              cursor: 'pointer',
              color: C.ter,
              fontSize: 14,
              fontWeight: 500,
              transition: 'color 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.sec)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.ter)}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{it.icon}</span>
            {it.label}
          </div>
        ))}

        <div
          style={{
            margin: '16px 16px 0',
            padding: '12px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: C.mute,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: C.sec,
              fontWeight: 700,
            }}
          >
            DR
          </div>
          <span style={{ fontSize: 12, color: C.sec, fontWeight: 500 }}>Dr. Smith</span>
        </div>
      </div>
    </div>
  )
}

/* ─── ENCOUNTER CARD (from brutalist wireframe) ─── */
function EncounterCard({ encounter, isActive, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      layoutId={`card-${encounter.id}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: C.card,
        border: isActive ? `3px solid ${C.red}` : `2px solid ${hovered ? C.white : C.border}`,
        cursor: 'pointer',
        transition: 'border-color 0.15s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Editorial Photo */}
      <div
        style={{
          width: '100%',
          height: 120,
          overflow: 'hidden',
          borderBottom: `2px solid ${C.border}`,
          position: 'relative',
        }}
      >
        <img
          src={getPhoto(encounter.cc)}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: isActive ? 'none' : 'grayscale(60%) contrast(1.1)',
            transition: 'filter 0.2s ease',
          }}
        />
        <span
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            fontFamily: C.mono,
            fontSize: 28,
            fontWeight: 900,
            color: C.white,
            textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {encounter.room}
        </span>
      </div>

      {/* Card Info */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontFamily: C.mono,
              fontSize: 13,
              color: C.sec,
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            {encounter.age}
            {encounter.sex}
          </span>
          {encounter.acuity <= 2 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.red, fontFamily: C.mono }}>
              ESI {encounter.acuity}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.white,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            lineHeight: 1.3,
          }}
        >
          {encounter.cc}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── STATUS COLUMN ─── */
const columnVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

function StatusColumn({ statusKey, encounters, activeId, onSelect }) {
  const status = STATUS[statusKey]
  const columnEncounters = encounters.filter((e) => e.status === statusKey)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        flex: '1 1 220px',
        minWidth: 200,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 10px',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Column Header */}
      <div
        style={{
          padding: '0 0 12px',
          borderBottom: `2px solid ${hovered ? C.red : C.border}`,
          marginBottom: 16,
          transition: 'border-color 0.15s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: C.white,
              letterSpacing: '0.12em',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {status.label}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: columnEncounters.length > 0 ? C.white : C.sec,
              fontFamily: C.mono,
            }}
          >
            {columnEncounters.length}
          </span>
        </div>
      </div>

      {/* Cards List */}
      <motion.div
        variants={columnVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 40,
        }}
      >
        <AnimatePresence>
          {columnEncounters.map((enc) => (
            <motion.div
              key={enc.id}
              variants={cardVariants}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              layout
            >
              <EncounterCard
                encounter={enc}
                isActive={enc.id === activeId}
                onClick={() => onSelect(enc.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {columnEncounters.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              border: `1px dashed ${C.border}`,
              padding: '32px 16px',
              textAlign: 'center',
              color: C.ter,
              fontSize: 12,
              fontFamily: C.mono,
              letterSpacing: '0.05em',
            }}
          >
            EMPTY
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

/* ─── INTEL PANELS (Brutalist) ─── */
function IntelPanel({ title, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        background: C.card,
        border: `2px solid ${C.border}`,
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: C.white,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 14,
          paddingBottom: 10,
          borderBottom: `1px solid ${C.border}`,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {title}
      </div>
      {children}
    </motion.div>
  )
}

function RulesPanel({ delay }) {
  return (
    <IntelPanel title="Clinical Decision Rules" delay={delay}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DECISION_RULES.map((rule, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              border: `1px solid ${C.border}`,
              background: C.black,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.white,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <span style={{ marginRight: 8, color: C.sec }}>{rule.icon}</span>
                {rule.name}
              </div>
              <div style={{ fontSize: 12, color: C.sec, marginTop: 3 }}>{rule.recommendation}</div>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: rule.risk === 'High' ? C.red : C.white,
                fontFamily: C.mono,
                letterSpacing: '0.05em',
              }}
            >
              {rule.score || rule.result}
            </div>
          </div>
        ))}
      </div>
    </IntelPanel>
  )
}

function GuidesPanel({ delay }) {
  return (
    <IntelPanel title="Society Guidelines" delay={delay}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {GUIDELINES.map((g, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              border: `1px solid ${C.border}`,
              background: C.black,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: C.red,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 4,
                fontFamily: C.mono,
              }}
            >
              {g.source}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{g.title}</div>
            <div style={{ fontSize: 13, color: C.sec, marginTop: 4, lineHeight: 1.5 }}>
              {g.relevance}
            </div>
          </div>
        ))}
      </div>
    </IntelPanel>
  )
}

function SurveillancePanel({ delay }) {
  return (
    <IntelPanel title="Regional Surveillance" delay={delay}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SURVEILLANCE.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              border: `1px solid ${s.level === 'elevated' ? C.red : C.border}`,
              background: C.black,
            }}
          >
            <span
              style={{
                fontSize: 16,
                color: s.level === 'elevated' ? C.red : C.sec,
                fontWeight: 800,
              }}
            >
              {s.icon}
            </span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: s.level === 'elevated' ? C.red : C.white,
                }}
              >
                {s.title}
              </div>
              <div style={{ fontSize: 12, color: C.sec, marginTop: 2 }}>{s.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </IntelPanel>
  )
}

/* ─── SLIDE OUT DETAIL PANEL ─── */
function DetailPanel({ encounter, onClose, onUpdateEncounter, isMobile }) {
  const [narrative, setNarrative] = useState('')
  const [isDictating, setIsDictating] = useState(false)
  const [isProcessed, setIsProcessed] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const textRef = useRef(null)

  useEffect(() => {
    if (encounter) {
      setNarrative(encounter.narrative || '')
      setIsProcessed(!!encounter.narrative && encounter.narrative.length > 50)
      setIsDictating(encounter.status === 'COMPOSING')
      setIsProcessing(encounter.status === 'BUILDING')
    }
  }, [encounter?.id])

  const handleProcess = useCallback(() => {
    if (!narrative.trim()) return
    setIsProcessing(true)
    onUpdateEncounter(encounter.id, { status: 'BUILDING', narrative })
    setTimeout(() => {
      setIsProcessing(false)
      setIsProcessed(true)
      onUpdateEncounter(encounter.id, { status: 'COMPLETE', narrative })
    }, 1800)
  }, [narrative, encounter, onUpdateEncounter])

  const handleDictate = useCallback(() => {
    if (isDictating) {
      setIsDictating(false)
      onUpdateEncounter(encounter.id, { status: 'NEW' })
    } else {
      setIsDictating(true)
      onUpdateEncounter(encounter.id, { status: 'COMPOSING' })
      const words = '45-year-old male presenting with acute onset low back pain...'.split(' ')
      let i = 0
      const interval = setInterval(() => {
        if (i < words.length) {
          setNarrative((prev) => prev + (prev ? ' ' : '') + words[i])
          i++
        } else {
          clearInterval(interval)
          setIsDictating(false)
        }
      }, 120)
    }
  }, [isDictating, encounter, onUpdateEncounter])

  if (!encounter) return null

  const panelWidth = isMobile ? '100%' : 600

  return (
    <>
      {/* Backdrop (Framer Motion) */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: C.dim,
            zIndex: 900,
            cursor: 'pointer',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Slide-out Panel (Framer Motion) */}
      <motion.div
        initial={{ x: panelWidth, opacity: 0.8 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: panelWidth, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: panelWidth,
          background: C.black,
          borderLeft: `2px solid ${C.border}`,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Photo banner */}
        <div
          style={{
            height: 120,
            overflow: 'hidden',
            borderBottom: `2px solid ${C.border}`,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <img
            src={getPhoto(encounter.cc)}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'grayscale(40%) contrast(1.2)',
            }}
          />
          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              background: C.black,
              border: `2px solid ${C.border}`,
              color: C.white,
              fontSize: 18,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </motion.button>
        </div>

        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: `2px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span
                style={{
                  fontFamily: C.mono,
                  fontSize: 28,
                  fontWeight: 900,
                  color: C.white,
                  letterSpacing: '-0.02em',
                }}
              >
                RM {encounter.room}
              </span>
              <span
                style={{
                  fontFamily: C.mono,
                  fontSize: 15,
                  color: C.sec,
                  fontWeight: 600,
                }}
              >
                {encounter.age}
                {encounter.sex}
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: C.white,
                letterSpacing: '0.12em',
                padding: '4px 10px',
                border: `1px solid ${C.border}`,
                fontFamily: C.mono,
              }}
            >
              {STATUS[encounter.status].label}
            </span>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 16,
              fontWeight: 700,
              color: C.white,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {encounter.cc}
          </div>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px 40px',
          }}
        >
          {/* Narrative area */}
          <div
            style={{
              position: 'relative',
              marginBottom: isProcessed ? 24 : 0,
              transition: 'margin 0.3s ease',
            }}
          >
            <div
              style={{
                border: isDictating
                  ? `2px solid ${C.red}`
                  : isProcessing
                    ? `2px solid ${C.sec}`
                    : `2px solid ${C.border}`,
                background: C.card,
                transition: 'border-color 0.2s ease',
              }}
            >
              {isDictating && (
                <div
                  style={{
                    padding: '6px 12px',
                    borderBottom: `1px solid ${C.border}`,
                    fontSize: 11,
                    fontWeight: 800,
                    color: C.red,
                    letterSpacing: '0.12em',
                    fontFamily: C.mono,
                    animation: 'blink 1.2s ease-in-out infinite',
                  }}
                >
                  ● RECORDING
                </div>
              )}

              <textarea
                ref={textRef}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Describe the encounter..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  minHeight: isProcessed ? 100 : 200,
                  padding: '16px 16px 60px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: C.white,
                  fontSize: 15,
                  lineHeight: 1.7,
                  fontFamily: C.font,
                  resize: 'vertical',
                }}
              />

              {/* Bottom toolbar */}
              <div
                style={{
                  padding: '8px 12px',
                  borderTop: `1px solid ${C.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleDictate}
                    style={{
                      width: 40,
                      height: 40,
                      background: isDictating ? C.red : 'transparent',
                      border: `2px solid ${isDictating ? C.red : C.border}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDictating ? C.white : C.sec,
                      fontSize: 18,
                      transition: 'all 0.15s ease',
                    }}
                    title={isDictating ? 'Stop' : 'Dictate'}
                  >
                    {isDictating ? '■' : '●'}
                  </button>
                  <button
                    onClick={() => textRef.current?.focus()}
                    style={{
                      width: 40,
                      height: 40,
                      background: 'transparent',
                      border: `2px solid ${C.border}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: C.sec,
                      fontSize: 16,
                    }}
                    title="Type"
                  >
                    ⌨
                  </button>
                </div>

                {narrative.trim() && !isProcessed && (
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    style={{
                      padding: '10px 20px',
                      background: isProcessing ? 'transparent' : C.red,
                      border: `2px solid ${isProcessing ? C.border : C.red}`,
                      color: C.white,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: isProcessing ? 'wait' : 'pointer',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontFamily: C.font,
                    }}
                  >
                    {isProcessing ? 'BUILDING...' : 'PROCESS →'}
                  </button>
                )}

                {isProcessed && (
                  <span
                    style={{
                      fontSize: 12,
                      color: C.white,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      fontFamily: C.mono,
                      padding: '4px 10px',
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    ✓ COMPLETE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Intelligence panels */}
          {isProcessed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <RulesPanel delay={0.1} />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 16,
                }}
              >
                <GuidesPanel delay={0.2} />
                <SurveillancePanel delay={0.3} />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

/* ─── SETTINGS MODAL (Slide up/Fade) ─── */
function SettingsPanel({ onClose, settings, onToggle }) {
  const toggles = [
    { key: 'decisionRules', label: 'CLINICAL DECISION RULES', desc: 'HEART, Wells, PERC, Ottawa' },
    { key: 'guidelines', label: 'SOCIETY GUIDELINES', desc: 'AHA, ACEP, specialty societies' },
    {
      key: 'surveillance',
      label: 'REGIONAL SURVEILLANCE',
      desc: 'Syndromic data, bioterrorism alerts',
    },
    { key: 'autoSort', label: 'AUTO-SORT ENCOUNTERS', desc: 'Organize by status automatically' },
    { key: 'dictation', label: 'VOICE DICTATION', desc: 'Microphone input for narratives' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: C.black,
        display: 'flex',
        flexDirection: 'column',
        padding: '60px 20px',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 500, width: '100%', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
            paddingBottom: 16,
            borderBottom: `2px solid ${C.border}`,
          }}
        >
          <h2
            style={{
              color: C.white,
              fontSize: 16,
              fontWeight: 800,
              margin: 0,
              letterSpacing: '0.12em',
            }}
          >
            SETTINGS
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `2px solid ${C.border}`,
              color: C.white,
              fontSize: 12,
              padding: '8px 16px',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.08em',
              fontFamily: C.font,
            }}
          >
            DONE
          </motion.button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toggles.map((t) => (
            <div
              key={t.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                border: `2px solid ${C.border}`,
                background: C.card,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 13, fontWeight: 800, color: C.white, letterSpacing: '0.05em' }}
                >
                  {t.label}
                </div>
                <div style={{ fontSize: 12, color: C.sec, marginTop: 4 }}>{t.desc}</div>
              </div>
              <div
                onClick={() => onToggle(t.key)}
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  background: settings[t.key] ? C.red : C.mute,
                  border: `2px solid ${settings[t.key] ? C.red : C.border}`,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
              >
                <motion.div
                  layout
                  initial={false}
                  animate={{
                    x: settings[t.key] ? 22 : 2,
                    backgroundColor: settings[t.key] ? C.white : C.sec,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    position: 'absolute',
                    top: 2,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── MAIN APP LIST ─── */
let nextId = 100

export default function App() {
  const [encounters, setEncounters] = useState(MOCK_ENCOUNTERS)
  const [activeId, setActiveId] = useState(null)
  const [mobile, setMobile] = useState(false)
  const [nav, setNav] = useState('board')
  const [sett, setSett] = useState(false)

  const [settings, setSettings] = useState({
    decisionRules: true,
    guidelines: true,
    surveillance: true,
    autoSort: true,
    dictation: true,
  })

  useEffect(() => {
    const c = () => setMobile(window.innerWidth < 768)
    c()
    window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  const handleUpdateEncounter = useCallback((id, updates) => {
    setEncounters((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))
  }, [])

  const addEncounter = useCallback(() => {
    const id = nextId++
    const newEnc = {
      id,
      room: String(Math.floor(Math.random() * 20) + 1),
      age: Math.floor(Math.random() * 70) + 10,
      sex: Math.random() > 0.5 ? 'M' : 'F',
      cc: CHIEF_COMPLAINTS[Math.floor(Math.random() * CHIEF_COMPLAINTS.length)],
      status: 'NEW',
      acuity: Math.floor(Math.random() * 4) + 1,
      narrative: '',
    }
    setEncounters((prev) => [...prev, newEnc])
    setActiveId(id)
  }, [])

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; }
        ::selection { background: rgba(229,62,62,0.3); }
        body { margin: 0; background: #0c0c0c; color: #fff; font-family: 'Inter', sans-serif; }
      `,
        }}
      />

      <div
        style={{
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          background: C.bg,
          display: 'flex',
        }}
      >
        <SideNav
          active={nav}
          onNav={(n) => (n === 'settings' ? setSett(true) : setNav(n))}
          counts={encounters.length}
          onAdd={addEncounter}
        />

        {/* Board View */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top Bar */}
          <div
            style={{
              height: 60,
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>BOARD</h1>
            <div style={{ fontSize: 13, color: C.sec, fontFamily: C.mono }}>
              {encounters.length} TOTAL
            </div>
          </div>

          {/* 4 Columns */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              overflowX: 'auto',
              padding: '24px 14px',
              gap: 10,
            }}
          >
            {STATUS_KEYS.map((key) => (
              <StatusColumn
                key={key}
                statusKey={key}
                encounters={encounters}
                activeId={activeId}
                onSelect={(id) => setActiveId(activeId === id ? null : id)}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeId && (
          <DetailPanel
            encounter={encounters.find((e) => e.id === activeId)}
            onClose={() => setActiveId(null)}
            onUpdateEncounter={handleUpdateEncounter}
            isMobile={mobile}
          />
        )}
        {sett && (
          <SettingsPanel
            onClose={() => setSett(false)}
            settings={settings}
            onToggle={(k) => setSettings((s) => ({ ...s, [k]: !s[k] }))}
          />
        )}
      </AnimatePresence>
    </>
  )
}
