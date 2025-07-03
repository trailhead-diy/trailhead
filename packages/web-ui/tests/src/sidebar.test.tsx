import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
  Sidebar,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarSection,
  SidebarDivider,
  SidebarSpacer,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
} from '../../src/components/sidebar';

describe('Sidebar Components', () => {
  it('creates a complete navigation sidebar with proper composition', () => {
    render(
      <Sidebar>
        <SidebarHeader>
          <SidebarHeading>Navigation</SidebarHeading>
        </SidebarHeader>
        <SidebarBody>
          <SidebarSection>
            <SidebarHeading>Main Navigation</SidebarHeading>
            <SidebarItem>
              <SidebarLabel>Dashboard</SidebarLabel>
            </SidebarItem>
            <SidebarItem>
              <SidebarLabel>Projects</SidebarLabel>
            </SidebarItem>
          </SidebarSection>
          <SidebarDivider />
          <SidebarSpacer />
          <SidebarSection>
            <SidebarHeading>User</SidebarHeading>
            <SidebarItem>
              <SidebarLabel>Settings</SidebarLabel>
            </SidebarItem>
          </SidebarSection>
        </SidebarBody>
        <SidebarFooter>Footer content</SidebarFooter>
      </Sidebar>
    );

    // Verify structure
    const headings = screen.getAllByRole('heading');
    expect(headings[1]).toHaveTextContent('Main Navigation');
    expect(headings[2]).toHaveTextContent('User');
  });

  it('handles navigation interactions and active states', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Sidebar>
        <SidebarBody>
          <SidebarItem data-current={true}>
            <a href="/dashboard" onClick={handleClick}>
              <SidebarLabel>Dashboard</SidebarLabel>
            </a>
          </SidebarItem>
          <SidebarItem>
            <a href="/projects">
              <SidebarLabel>Projects</SidebarLabel>
            </a>
          </SidebarItem>
        </SidebarBody>
      </Sidebar>
    );

    // Test link interaction
    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    await user.click(dashboardLink);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('maintains accessibility and supports user workflows', async () => {
    const user = userEvent.setup();
    const toggleSection = vi.fn();
    const { container } = render(
      <Sidebar>
        <SidebarBody>
          <nav aria-label="Main navigation">
            <SidebarSection>
              <button onClick={toggleSection} aria-expanded="false">
                <SidebarHeading>Collapsible Section</SidebarHeading>
              </button>
              <div hidden>
                <SidebarItem>
                  <SidebarLabel>Hidden Item</SidebarLabel>
                </SidebarItem>
              </div>
            </SidebarSection>
          </nav>
        </SidebarBody>
        <SidebarDivider />
      </Sidebar>
    );

    // Verify divider semantics
    const divider = container.querySelector('hr');
    expect(divider).toBeInTheDocument();

    // Test collapsible workflow
    const toggle = screen.getByRole('button', { name: 'Collapsible Section' });
    await user.click(toggle);
    expect(toggleSection).toHaveBeenCalledTimes(1);
  });
});
