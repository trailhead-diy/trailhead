import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SidebarLayout } from '../../src/components/sidebar-layout';

describe('SidebarLayout Component', () => {
  it('should compose application layout with navbar, sidebar, and main content', () => {
    render(
      <SidebarLayout
        navbar={<nav aria-label="Main navigation">Navigation</nav>}
        sidebar={<aside aria-label="Secondary navigation">Sidebar</aside>}
      >
        <main>
          <h1>Dashboard</h1>
          <p>Main application content</p>
        </main>
      </SidebarLayout>
    );

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });
});
