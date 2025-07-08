import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StackedLayout } from '../stacked-layout';

describe('StackedLayout Component', () => {
  it('should compose stacked layout with navbar, sidebar, and main content', () => {
    render(
      <StackedLayout
        navbar={<nav aria-label="Top navigation">Navigation</nav>}
        sidebar={<aside aria-label="Side navigation">Sidebar</aside>}
      >
        <main>
          <h1>Content Area</h1>
          <p>Stacked layout content</p>
        </main>
      </StackedLayout>
    );

    expect(screen.getByLabelText('Top navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('Side navigation')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Content Area' })).toBeInTheDocument();
    expect(screen.getByText('Stacked layout content')).toBeInTheDocument();
  });
});
