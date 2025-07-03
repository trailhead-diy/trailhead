/**
 * @fileoverview Core Functionality Integration Tests
 *
 * This consolidated test suite covers the essential functionality of all components
 * with minimal duplication. It focuses on high-value testing scenarios:
 * - Ref forwarding works for interactive components
 * - Components render without errors
 * - Core props are passed through correctly
 * - Critical accessibility features work
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';

// Import key components that need testing
import { Button } from '../../src/components/button';
import { Input } from '../../src/components/input';
import { Link } from '../../src/components/link';
import { NavbarItem } from '../../src/components/navbar';
import { SidebarItem } from '../../src/components/sidebar';
import { AvatarButton } from '../../src/components/avatar';
import { Select } from '../../src/components/select';
import { Textarea } from '../../src/components/textarea';

describe('Core Component Functionality', () => {
  describe('Ref Forwarding', () => {
    it('should forward refs for interactive components', () => {
      const buttonRef = createRef<HTMLButtonElement>();
      const linkRef = createRef<HTMLAnchorElement>();
      const inputRef = createRef<HTMLInputElement>();
      const selectRef = createRef<HTMLSelectElement>();
      const textareaRef = createRef<HTMLTextAreaElement>();

      render(
        <div>
          <Button ref={buttonRef}>Button</Button>
          <Link ref={linkRef} href="#test">
            Link
          </Link>
          <Input ref={inputRef} />
          <Select ref={selectRef}>
            <option>Test</option>
          </Select>
          <Textarea ref={textareaRef} />
        </div>
      );

      expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
      expect(linkRef.current).toBeInstanceOf(HTMLAnchorElement);
      expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
      expect(selectRef.current).toBeInstanceOf(HTMLSelectElement);
      expect(textareaRef.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('should forward refs for navigation components', () => {
      const navItemRef = createRef<HTMLAnchorElement | HTMLButtonElement>();
      const sidebarItemRef = createRef<HTMLAnchorElement | HTMLButtonElement>();
      const avatarButtonRef = createRef<HTMLButtonElement>();

      render(
        <div>
          <NavbarItem ref={navItemRef} href="#nav">
            Nav Item
          </NavbarItem>
          <SidebarItem ref={sidebarItemRef} href="#sidebar">
            Sidebar Item
          </SidebarItem>
          <AvatarButton ref={avatarButtonRef} initials="AB" />
        </div>
      );

      expect(navItemRef.current).toBeTruthy();
      expect(sidebarItemRef.current).toBeTruthy();
      expect(avatarButtonRef.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Basic Rendering', () => {
    it('should render all major components without errors', () => {
      const { container } = render(
        <div>
          <Button>Button Test</Button>
          <Input placeholder="Input test" />
          <Select>
            <option>Select test</option>
          </Select>
          <Textarea placeholder="Textarea test" />
          <Link href="#test">Link test</Link>
        </div>
      );

      expect(container).toBeInTheDocument();
      expect(screen.getByText('Button Test')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Input test')).toBeInTheDocument();
      expect(screen.getByText('Select test')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Textarea test')).toBeInTheDocument();
      expect(screen.getByText('Link test')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass through className prop correctly', () => {
      render(
        <div>
          <Button className="custom-button-class">Test Button</Button>
          <Input className="custom-input-class" />
          <Link className="custom-link-class" href="#test">
            Test Link
          </Link>
        </div>
      );

      expect(screen.getByText('Test Button')).toHaveClass('custom-button-class');
      expect(screen.getByRole('textbox').parentElement).toHaveClass('custom-input-class');
      expect(screen.getByText('Test Link')).toHaveClass('custom-link-class');
    });

    it('should handle variant props for key components', () => {
      render(
        <div>
          <Button color="blue">Blue Button</Button>
          <Button outline>Outline Button</Button>
          <Button disabled>Disabled Button</Button>
        </div>
      );

      const blueButton = screen.getByText('Blue Button');
      const outlineButton = screen.getByText('Outline Button');
      const disabledButton = screen.getByText('Disabled Button');

      expect(blueButton).toBeInTheDocument();
      expect(outlineButton).toBeInTheDocument();
      expect(disabledButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <div>
          <Button aria-label="Custom button label">Button</Button>
          <Input aria-label="Custom input label" />
          <Link href="#test" aria-label="Custom link label">
            Link
          </Link>
        </div>
      );

      expect(screen.getByLabelText('Custom button label')).toBeInTheDocument();
      expect(screen.getByLabelText('Custom input label')).toBeInTheDocument();
      expect(screen.getByLabelText('Custom link label')).toBeInTheDocument();
    });
  });
});
