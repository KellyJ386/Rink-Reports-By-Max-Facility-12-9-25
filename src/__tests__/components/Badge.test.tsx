/**
 * Tests for Badge components
 */

import { render, screen } from '@testing-library/react';
import { Badge, StatusBadge, SeverityBadge, RoleBadge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('should render with children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should apply info variant styles', () => {
    render(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info')).toHaveClass('bg-ice-100');
    expect(screen.getByText('Info')).toHaveClass('text-ice-800');
  });

  it('should apply success variant styles', () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-green-100');
  });

  it('should apply warning variant styles', () => {
    render(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-100');
  });

  it('should apply danger variant styles', () => {
    render(<Badge variant="danger">Danger</Badge>);
    expect(screen.getByText('Danger')).toHaveClass('bg-red-100');
  });

  it('should apply neutral variant styles by default', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('bg-rink-100');
    expect(screen.getByText('Default')).toHaveClass('text-rink-800');
  });

  it('should apply custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('should render with dot indicator', () => {
    const { container } = render(<Badge dot>With Dot</Badge>);
    // The dot is a sibling span inside the badge
    const dotElement = container.querySelector('span span.rounded-full');
    expect(dotElement).toBeInTheDocument();
  });

  it('should apply small size', () => {
    render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('text-xs');
    expect(screen.getByText('Small')).toHaveClass('px-2');
  });

  it('should apply medium size by default', () => {
    render(<Badge>Medium</Badge>);
    expect(screen.getByText('Medium')).toHaveClass('px-2.5');
    expect(screen.getByText('Medium')).toHaveClass('py-1');
  });
});

describe('StatusBadge', () => {
  it('should render DRAFT status correctly', () => {
    render(<StatusBadge status="DRAFT" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('should render SUBMITTED status correctly', () => {
    render(<StatusBadge status="SUBMITTED" />);
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('should render UNDER_REVIEW status correctly', () => {
    render(<StatusBadge status="UNDER_REVIEW" />);
    expect(screen.getByText('Under Review')).toBeInTheDocument();
  });

  it('should render APPROVED status correctly', () => {
    render(<StatusBadge status="APPROVED" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('should render RESOLVED status correctly', () => {
    render(<StatusBadge status="RESOLVED" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('should render OPEN status correctly', () => {
    render(<StatusBadge status="OPEN" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('should render CLOSED status correctly', () => {
    render(<StatusBadge status="CLOSED" />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('should render PENDING status correctly', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should render ACTIVE status correctly', () => {
    render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render INACTIVE status correctly', () => {
    render(<StatusBadge status="INACTIVE" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should render unknown status as-is', () => {
    render(<StatusBadge status="CUSTOM_STATUS" />);
    expect(screen.getByText('CUSTOM_STATUS')).toBeInTheDocument();
  });
});

describe('SeverityBadge', () => {
  it('should render MINOR severity correctly', () => {
    render(<SeverityBadge severity="MINOR" />);
    expect(screen.getByText('Minor')).toBeInTheDocument();
    expect(screen.getByText('Minor')).toHaveClass('bg-ice-100');
  });

  it('should render MODERATE severity correctly', () => {
    render(<SeverityBadge severity="MODERATE" />);
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toHaveClass('bg-yellow-100');
  });

  it('should render SERIOUS severity correctly', () => {
    render(<SeverityBadge severity="SERIOUS" />);
    expect(screen.getByText('Serious')).toBeInTheDocument();
    expect(screen.getByText('Serious')).toHaveClass('bg-red-100');
  });

  it('should render CRITICAL severity correctly', () => {
    render(<SeverityBadge severity="CRITICAL" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toHaveClass('bg-red-100');
  });

  it('should render unknown severity as-is', () => {
    render(<SeverityBadge severity="UNKNOWN_SEVERITY" />);
    expect(screen.getByText('UNKNOWN_SEVERITY')).toBeInTheDocument();
  });
});

describe('RoleBadge', () => {
  it('should render SUPER_ADMIN role correctly', () => {
    render(<RoleBadge role="SUPER_ADMIN" />);
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toHaveClass('bg-red-100');
  });

  it('should render FACILITY_ADMIN role correctly', () => {
    render(<RoleBadge role="FACILITY_ADMIN" />);
    expect(screen.getByText('Facility Admin')).toBeInTheDocument();
    expect(screen.getByText('Facility Admin')).toHaveClass('bg-yellow-100');
  });

  it('should render MANAGER role correctly', () => {
    render(<RoleBadge role="MANAGER" />);
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toHaveClass('bg-ice-100');
  });

  it('should render SUPERVISOR role correctly', () => {
    render(<RoleBadge role="SUPERVISOR" />);
    expect(screen.getByText('Supervisor')).toBeInTheDocument();
    expect(screen.getByText('Supervisor')).toHaveClass('bg-ice-100');
  });

  it('should render ICE_TECHNICIAN role correctly', () => {
    render(<RoleBadge role="ICE_TECHNICIAN" />);
    expect(screen.getByText('Ice Tech')).toBeInTheDocument();
    expect(screen.getByText('Ice Tech')).toHaveClass('bg-green-100');
  });

  it('should render STAFF role correctly', () => {
    render(<RoleBadge role="STAFF" />);
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toHaveClass('bg-rink-100');
  });

  it('should render unknown role as-is', () => {
    render(<RoleBadge role="CUSTOM_ROLE" />);
    expect(screen.getByText('CUSTOM_ROLE')).toBeInTheDocument();
  });
});
