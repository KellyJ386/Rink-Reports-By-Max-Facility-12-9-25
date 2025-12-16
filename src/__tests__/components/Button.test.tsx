/**
 * Tests for Button component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply primary variant styles by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-ice-600');
  });

  it('should apply secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-rink-100');
  });

  it('should apply danger variant styles', () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600');
  });

  it('should apply ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-transparent');
  });

  it('should apply small size styles', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-sm');
    expect(button).toHaveClass('px-3');
    expect(button).toHaveClass('py-1.5');
  });

  it('should apply medium size styles by default', () => {
    render(<Button>Medium</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-sm');
    expect(button).toHaveClass('px-4');
    expect(button).toHaveClass('py-2');
  });

  it('should apply large size styles', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-base');
    expect(button).toHaveClass('px-6');
    expect(button).toHaveClass('py-3');
  });

  it('should render left icon', () => {
    const Icon = () => <span data-testid="left-icon">Icon</span>;
    render(<Button leftIcon={<Icon />}>With Icon</Button>);

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('should render right icon', () => {
    const Icon = () => <span data-testid="right-icon">Icon</span>;
    render(<Button rightIcon={<Icon />}>With Icon</Button>);

    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button');

    // Button should be disabled when loading
    expect(button).toBeDisabled();
    // Should have spinner svg
    const spinner = container.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should hide left icon when loading', () => {
    const Icon = () => <span data-testid="left-icon">Icon</span>;
    render(<Button isLoading leftIcon={<Icon />}>Loading</Button>);

    // Left icon should not be shown when loading
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('should render with type="submit" for form buttons', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('should apply disabled styles class', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');
    // The component includes disabled styles as part of base class
    expect(button).toHaveClass('disabled:opacity-50');
    expect(button).toHaveClass('disabled:cursor-not-allowed');
  });

  it('should apply focus ring styles', () => {
    render(<Button>Focusable</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:ring-2');
    expect(button).toHaveClass('focus:ring-offset-2');
  });
});
