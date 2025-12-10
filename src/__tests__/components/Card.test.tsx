/**
 * Tests for Card components
 */

import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

describe('Card', () => {
  it('should render with children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should apply default styles', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('shadow-sm');
  });

  it('should apply custom className', () => {
    render(<Card className="custom-class">Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('custom-class');
  });

  it('should apply default padding (md)', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('p-6');
  });

  it('should apply no padding when padding="none"', () => {
    render(<Card padding="none">Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).not.toHaveClass('p-6');
    expect(card).not.toHaveClass('p-4');
    expect(card).not.toHaveClass('p-8');
  });

  it('should apply small padding when padding="sm"', () => {
    render(<Card padding="sm">Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('p-4');
  });

  it('should apply large padding when padding="lg"', () => {
    render(<Card padding="lg">Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('p-8');
  });
});

describe('CardHeader', () => {
  it('should render with title', () => {
    render(<CardHeader title="Header Title" />);
    expect(screen.getByText('Header Title')).toBeInTheDocument();
  });

  it('should render title in h3 element', () => {
    render(<CardHeader title="Title" />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Title');
  });

  it('should render with title and description', () => {
    render(<CardHeader title="Title" description="Description text" />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('should render with action', () => {
    render(<CardHeader title="Title" action={<button>Action</button>} />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('should apply header styles to container', () => {
    const { container } = render(<CardHeader title="Header" />);
    // The header container is the first div
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass('pb-4');
    expect(header).toHaveClass('border-b');
  });

  it('should apply custom className to container', () => {
    const { container } = render(<CardHeader title="Header" className="custom-header" />);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass('custom-header');
  });
});

describe('CardContent', () => {
  it('should render with children', () => {
    render(<CardContent>Body content</CardContent>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('should apply content styles', () => {
    render(<CardContent>Body</CardContent>);
    const content = screen.getByText('Body');
    expect(content).toHaveClass('pt-4');
  });

  it('should apply custom className', () => {
    render(<CardContent className="custom-content">Body</CardContent>);
    expect(screen.getByText('Body')).toHaveClass('custom-content');
  });
});

describe('CardFooter', () => {
  it('should render with children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('should apply footer styles', () => {
    render(<CardFooter>Footer</CardFooter>);
    const footer = screen.getByText('Footer');
    expect(footer).toHaveClass('pt-4');
    expect(footer).toHaveClass('border-t');
    expect(footer).toHaveClass('mt-4');
  });

  it('should apply flex layout styles', () => {
    render(<CardFooter>Footer</CardFooter>);
    const footer = screen.getByText('Footer');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
    expect(footer).toHaveClass('justify-end');
  });

  it('should apply custom className', () => {
    render(<CardFooter className="custom-footer">Footer</CardFooter>);
    expect(screen.getByText('Footer')).toHaveClass('custom-footer');
  });
});

describe('Card composition', () => {
  it('should render with header, content, and footer', () => {
    render(
      <Card padding="none">
        <CardHeader title="Title" />
        <CardContent>Main content</CardContent>
        <CardFooter>Actions</CardFooter>
      </Card>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should maintain proper visual hierarchy', () => {
    const { container } = render(
      <Card padding="none">
        <CardHeader title="Header" />
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    // Find the card's first child elements
    const card = container.firstChild as HTMLElement;
    const [header] = Array.from(card.children) as HTMLElement[];
    const content = screen.getByText('Content');
    const footer = screen.getByText('Footer');

    // Header should have bottom border
    expect(header).toHaveClass('border-b');

    // Footer should have top border
    expect(footer).toHaveClass('border-t');

    // Content should have top padding
    expect(content).toHaveClass('pt-4');
  });
});
