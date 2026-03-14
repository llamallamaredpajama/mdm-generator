import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/firebase'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { useTypewriter } from '../hooks/useTypewriter'
import AuthModal from '../components/AuthModal'
import './LandingPage.css'

interface SlideCard {
  label: string
  quote: string
}

interface SlideData {
  room: string
  patient: string
  image: string
  cards: SlideCard[]
  id?: string
}

const SLIDES: SlideData[] = [
  {
    room: 'ROOM 7',
    patient: '78F, altered mental status',
    image: '/bg/Gemini_Generated_Image_vl9d8lvl9d8lvl9d.jpg',
    id: 'features',
    cards: [
      { label: 'Anonymous by Design', quote: '"Zero PHI. Zero risk.\nComplete HIPAA compliance."' },
      { label: 'Worst-First Logic', quote: '"Life-threatening diagnoses\nsurface first. Always."' },
      {
        label: 'Clinical Decision Rules',
        quote: '"HEART, PECARN, Wells \u2014\ncalculated automatically."',
      },
    ],
  },
  {
    room: 'ROOM 12',
    patient: '52M, chest pain',
    image: '/bg/Gemini_Generated_Image_s532u4s532u4s532.jpg',
    cards: [
      {
        label: 'Physician-First Workflow',
        quote: '"Dictate naturally.\nWe handle the documentation."',
      },
      { label: 'Built for the ED', quote: '"Designed by EM physicians,\nfor EM physicians."' },
      { label: 'Real-Time MDM', quote: '"Medical Decision Making\ngenerated in seconds."' },
    ],
  },
  {
    room: 'ROOM 23',
    patient: '34F, severe headache',
    image: '/bg/Gemini_Generated_Image_rdzlourdzlourdzl.jpg',
    cards: [
      { label: 'Focus on the Patient', quote: '"Less screen time.\nMore face time."' },
      { label: 'Evidence-Based', quote: '"Every differential backed\nby clinical literature."' },
      {
        label: 'Smart Differentials',
        quote: '"AI-powered worst-first\ndifferential diagnosis."',
      },
    ],
  },
  {
    room: 'ROOM 4',
    patient: '28M, abdominal pain',
    image: '/bg/Gemini_Generated_Image_bjk837bjk837bjk8.jpg',
    id: 'pricing',
    cards: [
      { label: 'No Storage. No Risk.', quote: '"Client-side only.\nNothing persists."' },
      { label: 'Copy-Paste Ready', quote: '"One click to your EHR.\nFormatted perfectly."' },
      { label: 'Subscription Tiers', quote: '"Free tier included.\nScale when you\'re ready."' },
    ],
  },
  {
    room: 'ROOM 31',
    patient: '81M, shortness of breath',
    image: '/bg/Gemini_Generated_Image_c79zhwc79zhwc79z.jpg',
    cards: [
      {
        label: 'Attestation Included',
        quote: '"Physician review statement\nbuilt into every note."',
      },
      { label: 'Rapid Documentation', quote: '"Complete MDM in\nunder 60 seconds."' },
      { label: 'Educational Tool', quote: '"Learn MDM complexity\nwhile you document."' },
    ],
  },
]

const TOTAL_SLIDES = SLIDES.length

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const prefersReducedMotion = usePrefersReducedMotion()

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [preloaderLoaded, setPreloaderLoaded] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [preloaderProgress, setPreloaderProgress] = useState(0)

  const slidesContainerRef = useRef<HTMLElement>(null)
  const slideRefs = useRef<(HTMLElement | null)[]>([])
  const grainCanvasRef = useRef<HTMLCanvasElement>(null)
  const grainVisibleRef = useRef(false)

  const { displayedRoom, displayedPatient, phase } = useTypewriter({
    roomText: SLIDES[currentIndex].room,
    patientText: SLIDES[currentIndex].patient,
    isActive: preloaderLoaded,
    prefersReducedMotion,
    initialDelay: 1400,
    pauseBetween: 700,
  })

  const handleCTA = useCallback(() => {
    if (user) {
      navigate('/compose')
    } else {
      setAuthModalOpen(true)
    }
  }, [user, navigate])

  // ── Preloader ──
  useEffect(() => {
    let progress = 0
    const tick = setInterval(() => {
      progress = Math.min(progress + Math.random() * 15, 90)
      setPreloaderProgress(progress)
    }, 200)

    const firstImg = new Image()
    firstImg.src = SLIDES[0].image

    const finish = () => {
      clearInterval(tick)
      setPreloaderProgress(100)
      setTimeout(() => setPreloaderLoaded(true), 400)
    }

    if (firstImg.complete) {
      finish()
    } else {
      firstImg.onload = finish
      setTimeout(finish, 4000) // fallback
    }

    return () => clearInterval(tick)
  }, [])

  // ── Film Grain ──
  useEffect(() => {
    if (prefersReducedMotion || !preloaderLoaded) return

    const canvas = grainCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let timer: ReturnType<typeof setTimeout>

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const render = () => {
      const w = canvas.width
      const h = canvas.height
      const imageData = ctx.createImageData(w, h)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0
        data[i] = v
        data[i + 1] = v
        data[i + 2] = v
        data[i + 3] = 14
      }
      ctx.putImageData(imageData, 0, 0)
    }

    const loop = () => {
      render()
      timer = setTimeout(loop, 120) // ~8fps
    }

    resize()
    window.addEventListener('resize', resize)
    loop()
    grainVisibleRef.current = true

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', resize)
    }
  }, [prefersReducedMotion, preloaderLoaded])

  // ── Scroll to slide ──
  const scrollToSlide = useCallback((index: number) => {
    const target = slideRefs.current[index]
    const container = slidesContainerRef.current
    if (!target || !container) return
    container.scrollTo({ top: target.offsetTop, behavior: 'smooth' })
  }, [])

  // ── IntersectionObserver ──
  useEffect(() => {
    const container = slidesContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            slideRefs.current.forEach((s) => s?.classList.remove('active'))
            el.classList.add('active')
            const idx = parseInt(el.dataset.index ?? '0', 10)
            setCurrentIndex(idx)
            if (idx > 0 && !hasScrolled) setHasScrolled(true)
          }
        })
      },
      { root: container, threshold: 0.55 },
    )

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide)
    })

    return () => observer.disconnect()
  }, [hasScrolled])

  // ── Kick-start first slide after initial paint settles ──
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      slideRefs.current[0]?.classList.add('active')
      setCurrentIndex(0)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  // ── Keyboard navigation ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (authModalOpen) return
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        const next = Math.min(currentIndex + 1, TOTAL_SLIDES - 1)
        scrollToSlide(next)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = Math.max(currentIndex - 1, 0)
        scrollToSlide(prev)
      } else if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [currentIndex, isMenuOpen, authModalOpen, scrollToSlide])

  const toggleMenu = () => setIsMenuOpen((prev) => !prev)

  const handleNavScroll = (slideId: string) => {
    const idx = SLIDES.findIndex((s) => s.id === slideId)
    if (idx >= 0) scrollToSlide(idx)
    if (isMenuOpen) setIsMenuOpen(false)
  }

  return (
    <div className="cinematic-landing">
      {/* Preloader */}
      <div className={`cl-preloader${preloaderLoaded ? ' loaded' : ''}`}>
        <div className="cl-preloader__brand">
          <span className="cl-preloader__ai">ai</span>MDM
          <span className="cl-preloader__dot">.</span>
        </div>
        <div className="cl-preloader__bar">
          <div className="cl-preloader__bar-fill" style={{ width: `${preloaderProgress}%` }} />
        </div>
      </div>

      {/* Film Grain */}
      <div
        className={`cl-grain${preloaderLoaded && !prefersReducedMotion ? ' visible' : ''}`}
        aria-hidden="true"
      >
        <canvas ref={grainCanvasRef} />
      </div>

      {/* Navigation */}
      <nav className="cl-nav" role="navigation" aria-label="Main navigation">
        <button className="cl-nav__logo" onClick={() => scrollToSlide(0)} aria-label="aiMDM Home">
          <span className="cl-nav__logo-ai">ai</span>MDM<span className="cl-nav__logo-dot">.</span>
        </button>
        <div className="cl-nav__links">
          <button className="cl-nav__link" onClick={() => handleNavScroll('features')}>
            Features
          </button>
          <button className="cl-nav__link" onClick={() => handleNavScroll('pricing')}>
            Pricing
          </button>
          <button className="cl-nav__link cl-nav__link--cta" onClick={handleCTA}>
            {user ? 'Dashboard' : 'Login'}
          </button>
        </div>
        <button
          className={`cl-nav__hamburger${isMenuOpen ? ' open' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`cl-mobile-menu__backdrop${isMenuOpen ? ' open' : ''}`}
        onClick={toggleMenu}
      />
      <div
        className={`cl-mobile-menu${isMenuOpen ? ' open' : ''}`}
        role="dialog"
        aria-label="Mobile navigation"
      >
        <button className="cl-mobile-menu__link" onClick={() => handleNavScroll('features')}>
          Features
        </button>
        <button className="cl-mobile-menu__link" onClick={() => handleNavScroll('pricing')}>
          Pricing
        </button>
        <button className="cl-mobile-menu__link" onClick={handleCTA}>
          {user ? 'Dashboard' : 'Login'}
        </button>
      </div>

      {/* Slide counter */}
      <div className="cl-slide-counter" aria-hidden="true">
        <span className="cl-slide-counter__current">
          {String(currentIndex + 1).padStart(2, '0')}
        </span>
        <span>/</span>
        <span className="cl-slide-counter__total">{String(TOTAL_SLIDES).padStart(2, '0')}</span>
      </div>

      {/* Scroll hint */}
      <div className={`cl-scroll-hint${hasScrolled ? ' hidden' : ''}`}>
        <span className="cl-scroll-hint__text">Scroll</span>
        <div className="cl-scroll-hint__line" />
      </div>

      {/* Slides */}
      <main className="cl-slides" ref={slidesContainerRef}>
        {SLIDES.map((slide, i) => (
          <section
            key={i}
            className="cl-slide"
            data-index={i}
            id={slide.id}
            ref={(el) => {
              slideRefs.current[i] = el
            }}
          >
            <div className="cl-slide__bg">
              <img
                src={slide.image}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
            <div className="cl-slide__overlay" />

            <div className="cl-slide__content-left">
              <div className="cl-slide__dept">Emergency Department</div>
              <h2 className={`cl-slide__room${i === currentIndex ? ' cl-slide__room--typed' : ''}`}>
                {i === currentIndex && !prefersReducedMotion ? displayedRoom : slide.room}
                {i === currentIndex && (phase === 'room' || phase === 'pause') && (
                  <span className="cl-slide__cursor cl-slide__cursor--room">{'\u2588'}</span>
                )}
              </h2>
              <div className="cl-slide__redaction" />
              <p
                className={`cl-slide__patient${i === currentIndex ? ' cl-slide__patient--typed' : ''}`}
              >
                {i === currentIndex && !prefersReducedMotion ? displayedPatient : slide.patient}
                {i === currentIndex && (phase === 'patient' || phase === 'done') && (
                  <span
                    className={`cl-slide__cursor${phase === 'patient' ? ' cl-slide__cursor--typing' : ''}`}
                  >
                    {'\u2588'}
                  </span>
                )}
              </p>
            </div>

            <div className="cl-slide__content-right">
              {slide.cards.map((card, ci) => (
                <div
                  key={ci}
                  className="cl-slide__card"
                  style={{ '--stagger': `${0.4 + ci * 0.3}s` } as React.CSSProperties}
                >
                  <div className="cl-slide__card-label">{card.label}</div>
                  <div className="cl-slide__card-stars">{'\u2605\u2605\u2605\u2605\u2605'}</div>
                  <blockquote className="cl-slide__card-quote">
                    {card.quote.split('\n').map((line, li) => (
                      <span key={li}>
                        {line}
                        {li < card.quote.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </blockquote>
                </div>
              ))}
            </div>

            <button className="cl-slide__cta" onClick={handleCTA}>
              Start Documenting <span className="cl-slide__cta-arrow">&rarr;</span>
            </button>
          </section>
        ))}
      </main>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
