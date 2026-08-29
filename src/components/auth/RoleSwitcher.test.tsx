import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoleSwitcher from './RoleSwitcher';

describe('RoleSwitcher Component', () => {
  it('renders Buyer and Organiser tabs by default', () => {
    render(<RoleSwitcher role="buyer" onRoleChange={vi.fn()} showAdminTab={false} />);

    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Organiser')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('renders Admin tab when showAdminTab is true', () => {
    render(<RoleSwitcher role="admin" onRoleChange={vi.fn()} showAdminTab={true} />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('fires onRoleChange when tabs are selected', () => {
    const onRoleChangeMock = vi.fn();
    render(<RoleSwitcher role="buyer" onRoleChange={onRoleChangeMock} showAdminTab={true} />);

    fireEvent.click(screen.getByText('Organiser'));
    expect(onRoleChangeMock).toHaveBeenCalledWith('producer');

    fireEvent.click(screen.getByText('Admin'));
    expect(onRoleChangeMock).toHaveBeenCalledWith('admin');
  });
});
