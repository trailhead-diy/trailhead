import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  Navbar,
  NavbarDivider,
  NavbarSection,
  NavbarSpacer,
  NavbarItem,
  NavbarLabel,
} from '../navbar'

describe('Navbar Components', () => {
  it('should render complete navigation structure with proper composition', () => {
    render(
      <Navbar>
        <NavbarSection>
          <NavbarLabel>Brand</NavbarLabel>
          <NavbarDivider />
          <NavbarItem href="/home">Home</NavbarItem>
          <NavbarItem href="/about">About</NavbarItem>
        </NavbarSection>
        <NavbarSpacer />
        <NavbarSection>
          <NavbarItem href="/login">Login</NavbarItem>
          <NavbarDivider />
          <NavbarItem href="/signup">Sign Up</NavbarItem>
        </NavbarSection>
      </Navbar>
    )

    // Test navigation structure
    expect(screen.getByText('Brand')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/signup')
  })

  it('should handle navigation items and accessibility', () => {
    render(
      <Navbar aria-label="Main navigation">
        <NavbarSection>
          <NavbarItem aria-current="page">Dashboard</NavbarItem>
          <NavbarItem href="/settings">Settings</NavbarItem>
        </NavbarSection>
      </Navbar>
    )

    const nav = screen.getByLabelText('Main navigation')
    expect(nav).toBeInTheDocument()

    const currentPage = screen.getByText('Dashboard')
    expect(currentPage).toHaveAttribute('aria-current', 'page')

    const settingsLink = screen.getByRole('link', { name: 'Settings' })
    expect(settingsLink).toHaveAttribute('href', '/settings')
  })
})
