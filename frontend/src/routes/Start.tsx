import { useNavigate } from 'react-router-dom'
import { useAuth, signInWithGoogle, signOutUser } from '../lib/firebase'
import SubscriptionStatus from '../components/SubscriptionStatus'
import './Start.css'

export default function Start() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
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
              <div className="user-menu">
                <SubscriptionStatus />
                <span className="user-email">{user.email}</span>
                <button onClick={() => signOutUser()} className="btn-signout">
                  Sign Out
                </button>
              </div>
            ) : (
              <button onClick={signInWithGoogle} className="btn-signin">
                Sign In
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
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-main">Emergency Medicine</span>
            <span className="title-accent">MDM Documentation</span>
          </h1>
          <p className="hero-subtitle">
            Transform your clinical narrative into compliant, high-complexity MDM documentation
            with our AI-powered tool designed specifically for Emergency Medicine physicians.
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
              Designed By Physicians For Physicians
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="pulse-container">
            <div className="pulse pulse-1"></div>
            <div className="pulse pulse-2"></div>
            <div className="pulse pulse-3"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Built for Emergency Medicine</h2>
          <div className="features-grid">
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
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">Simple Three-Step Process</h2>
          <div className="steps">
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