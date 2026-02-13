import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, signInWithGoogle } from '../lib/firebase'
import { useIsMobile } from '../hooks/useMediaQuery'
import UserAccountDropdown from '../components/UserAccountDropdown'
import './Start.css'

// Desktop: 6 QRS complexes across 3000-unit viewBox
const EKG_PATH_DESKTOP =
  'M 0,85 L 100,85 Q 135,72 170,85 L 190,85 L 194,90 L 202,2 L 210,95 L 215,85 L 245,85 Q 280,68 315,85 L 600,85 Q 635,72 670,85 L 690,85 L 694,90 L 702,2 L 710,95 L 715,85 L 745,85 Q 780,68 815,85 L 1100,85 Q 1135,72 1170,85 L 1190,85 L 1194,90 L 1202,2 L 1210,95 L 1215,85 L 1245,85 Q 1280,68 1315,85 L 1600,85 Q 1635,72 1670,85 L 1690,85 L 1694,90 L 1702,2 L 1710,95 L 1715,85 L 1745,85 Q 1780,68 1815,85 L 2100,85 Q 2135,72 2170,85 L 2190,85 L 2194,90 L 2202,2 L 2210,95 L 2215,85 L 2245,85 Q 2280,68 2315,85 L 2600,85 Q 2635,72 2670,85 L 2690,85 L 2694,90 L 2702,2 L 2710,95 L 2715,85 L 2745,85 Q 2780,68 2815,85 L 3000,85'

// Mobile: 3 QRS complexes across 1500-unit viewBox
const EKG_PATH_MOBILE =
  'M 0,85 L 100,85 Q 135,72 170,85 L 190,85 L 194,90 L 202,2 L 210,95 L 215,85 L 245,85 Q 280,68 315,85 L 600,85 Q 635,72 670,85 L 690,85 L 694,90 L 702,2 L 710,95 L 715,85 L 745,85 Q 780,68 815,85 L 1100,85 Q 1135,72 1170,85 L 1190,85 L 1194,90 L 1202,2 L 1210,95 L 1215,85 L 1245,85 Q 1280,68 1315,85 L 1500,85'

function useScrollDots(itemCount: number, childSelector?: string) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      const maxScroll = scrollWidth - clientWidth
      if (maxScroll <= 0) return setActiveIndex(0)
      const index = Math.round((scrollLeft / maxScroll) * (itemCount - 1))
      setActiveIndex(index)
    }
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [itemCount])

  const scrollTo = useCallback((index: number) => {
    const container = scrollRef.current
    if (!container) return
    const children = childSelector
      ? Array.from(container.querySelectorAll(childSelector))
      : Array.from(container.children)
    const child = children[index] as HTMLElement
    if (child) {
      container.scrollTo({
        left: child.offsetLeft - container.offsetLeft,
        behavior: 'smooth',
      })
    }
  }, [childSelector])

  return { scrollRef, activeIndex, scrollTo }
}

export default function Start() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const { scrollRef: featuresRef, activeIndex: featuresActive, scrollTo: featuresScrollTo } = useScrollDots(4)
  const { scrollRef: stepsRef, activeIndex: stepsActive, scrollTo: stepsScrollTo } = useScrollDots(3, '.step')

  const ekgPath = isMobile ? EKG_PATH_MOBILE : EKG_PATH_DESKTOP
  const ekgViewBox = isMobile ? '0 0 1500 100' : '0 0 3000 100'
  const ekgDur = isMobile ? '8s' : '16s'

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="nav-logo">MDM</span>
            <span className="nav-text">Generator</span>
          </div>
          <div className="nav-actions">
            {user ? (
              <UserAccountDropdown iconOnly />
            ) : (
              <button onClick={signInWithGoogle} className="btn-login-link">
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        <div className="em-title-section">
          <div className="em-title-wrapper">
            <h1 className="em-title">Emergency Medicine</h1>
            <div className="ekg-underline" aria-hidden="true">
              <div className="ekg-track">
                <svg className="ekg-svg" viewBox={ekgViewBox} preserveAspectRatio="none" overflow="visible">
                  <defs>
                    <filter id="electron-blur" x="-300%" y="-300%" width="700%" height="700%">
                      <feGaussianBlur stdDeviation={5} />
                    </filter>
                    <radialGradient id="ekg-glow">
                      <stop offset="0%" stopColor="#fff" stopOpacity={1} />
                      <stop offset="25%" stopColor="#ffaab5" stopOpacity={0.7} />
                      <stop offset="55%" stopColor="#ff6b7a" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#dc3545" stopOpacity={0} />
                    </radialGradient>
                  </defs>
                  <path
                    id="ekg-trace-path"
                    d={ekgPath}
                    fill="none"
                    stroke="#dc3545"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <g className="electron-dot">
                    <animateMotion dur={ekgDur} repeatCount="indefinite" calcMode="linear"
                      keyPoints="1;0" keyTimes="0;1">
                      <mpath href="#ekg-trace-path" />
                    </animateMotion>
                    <circle r={18} fill="url(#ekg-glow)" filter="url(#electron-blur)" />
                    <circle r={4} fill="#fff" opacity={0.95} />
                  </g>
                </svg>
                <svg className="ekg-svg" viewBox={ekgViewBox} preserveAspectRatio="none" overflow="visible">
                  <path
                    id="ekg-trace-path-2"
                    d={ekgPath}
                    fill="none"
                    stroke="#dc3545"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <g className="electron-dot">
                    <animateMotion dur={ekgDur} repeatCount="indefinite" calcMode="linear"
                      keyPoints="1;0" keyTimes="0;1">
                      <mpath href="#ekg-trace-path-2" />
                    </animateMotion>
                    <circle r={18} fill="url(#ekg-glow)" filter="url(#electron-blur)" />
                    <circle r={4} fill="#fff" opacity={0.95} />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-title">
            <span className="title-accent">MDM Documentation</span>
          </div>
          <p className="hero-subtitle">
            Transform your clinical narrative into useful, human-readable, billable, high-complexity
            MDM documentation with our AI-powered tool designed specifically for Emergency Medicine
            Physicians. You tell it WHAT you're thinking and it will explain the WHY for you.
          </p>
          <div className="hero-cta">
            {user ? (
              <button 
                onClick={() => navigate('/compose')} 
                className="btn-primary btn-large"
              >
                Start Documenting
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ) : (
              <button 
                onClick={signInWithGoogle} 
                className="btn-primary btn-large"
              >
                Get Started
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="hero-badge">
          <span className="badge-item">
            <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            HIPAA Compliant
          </span>
          <span className="badge-item">
            <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 3v7H3v4h7v7h4v-7h7v-4h-7V3h-4z"/>
            </svg>
            Designed by ER Physicians for ER Physicians
          </span>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Built for Emergency Medicine</h2>
          <div className="scroll-section">
            <div className="features-grid" ref={featuresRef}>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3>Rapid Documentation</h3>
                <p>Generate comprehensive MDM documentation in seconds, not minutes</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3>Worst-First Approach</h3>
                <p>Automatically prioritizes life-threatening differentials for EM practice</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3>PHI Protected</h3>
                <p>Educational tool with no PHI storage - your data never leaves your browser</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3>AI-Powered</h3>
                <p>Leverages advanced LLM technology trained on EM documentation standards</p>
              </div>
            </div>
            <div className="scroll-dots">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  className={`scroll-dot${featuresActive === i ? ' active' : ''}`}
                  onClick={() => featuresScrollTo(i)}
                  aria-label={`Go to feature ${i + 1}`}
                />
              ))}
            </div>
            <span className="scroll-hint">
              Swipe <span className="scroll-hint-arrow">&rarr;</span>
            </span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">Simple Three-Step Process</h2>
          <div className="scroll-section">
            <div className="steps" ref={stepsRef}>
              <div className="step">
                <div className="step-number">1</div>
                <h3>Dictate Your Narrative</h3>
                <p>Enter your clinical encounter in natural language</p>
              </div>
              <div className="step-connector"></div>
              <div className="step">
                <div className="step-number">2</div>
                <h3>Confirm Safety</h3>
                <p>Verify no PHI is included</p>
              </div>
              <div className="step-connector"></div>
              <div className="step">
                <div className="step-number">3</div>
                <h3>Review & Copy</h3>
                <p>Get formatted MDM ready for your EMR</p>
              </div>
            </div>
            <div className="scroll-dots">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  className={`scroll-dot${stepsActive === i ? ' active' : ''}`}
                  onClick={() => stepsScrollTo(i)}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
            <span className="scroll-hint">
              Swipe <span className="scroll-hint-arrow">&rarr;</span>
            </span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Streamline Your Documentation?</h2>
          <p>Join emergency physicians who are saving time on every shift</p>
          {user ? (
            <button 
              onClick={() => navigate('/compose')} 
              className="btn-primary btn-large"
            >
              Start Documenting Now
            </button>
          ) : (
            <button 
              onClick={signInWithGoogle} 
              className="btn-primary btn-large"
            >
              Sign Up Free
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">MDM Generator</span>
              <p>Educational tool for Emergency Medicine documentation</p>
            </div>
            <div className="footer-disclaimer">
              <p className="disclaimer-text">
                <strong>⚠️ Important Notice:</strong> This tool is for educational purposes only. 
                Never enter Protected Health Information (PHI) or real patient data. 
                All generated documentation must be reviewed and verified by a licensed physician before use.
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 MDM Generator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}