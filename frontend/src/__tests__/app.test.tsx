import { render, screen } from '@testing-library/react'
import App from '../App'
import { describe, it, expect } from 'vitest'

describe('App', () => {
  it('renders Vite and React links', () => {
    render(<App />)
    expect(screen.getByText(/Vite/)).toBeInTheDocument()
    expect(screen.getByText(/React/)).toBeInTheDocument()
  })
})

