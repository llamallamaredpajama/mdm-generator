/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Layout from '../routes/Layout'

vi.mock('../components/ErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Layout header', () => {
  it('renders brand with dot suffix', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )
    const brand = screen.getByText((_, el) =>
      Boolean(el?.classList.contains('layout-brand-text') && el?.textContent === 'aiMDM.'),
    )
    expect(brand).toBeTruthy()
  })

  it('does not render a pencil icon in nav', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )
    // The compose link should have no child SVG
    const composeLink = screen.getByText('Compose')
    expect(composeLink.querySelector('svg')).toBeNull()
  })
})
