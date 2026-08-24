import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PasswordRecoveryModal from './PasswordRecoveryModal';

describe('PasswordRecoveryModal Unit Tests', () => {
  const defaultProps = {
    newPassword: '',
    setNewPassword: vi.fn(),
    confirmPassword: '',
    setConfirmPassword: vi.fn(),
    showPassword: false,
    setShowPassword: vi.fn(),
    loading: false,
    onSubmit: vi.fn((e) => e.preventDefault()),
  };

  it('renders title and input fields correctly', () => {
    render(<PasswordRecoveryModal {...defaultProps} />);

    expect(screen.getByText('Create New Password')).toBeInTheDocument();
    expect(screen.getByText('NEW SECURE PASSWORD')).toBeInTheDocument();
    expect(screen.getByText('CONFIRM NEW PASSWORD')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update My Password/i })).toBeInTheDocument();
  });

  it('calls setNewPassword and setConfirmPassword on user input', () => {
    render(<PasswordRecoveryModal {...defaultProps} />);

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwordInputs[0], { target: { value: 'NewSecret123!' } });
    expect(defaultProps.setNewPassword).toHaveBeenCalledWith('NewSecret123!');

    fireEvent.change(passwordInputs[1], { target: { value: 'NewSecret123!' } });
    expect(defaultProps.setConfirmPassword).toHaveBeenCalledWith('NewSecret123!');
  });

  it('toggles password visibility when eye button is clicked', () => {
    render(<PasswordRecoveryModal {...defaultProps} showPassword={false} />);

    const toggleButton = screen.getByRole('button', { name: '' });
    fireEvent.click(toggleButton);

    expect(defaultProps.setShowPassword).toHaveBeenCalledWith(true);
  });

  it('disables submit button and shows loading text during submission', () => {
    render(<PasswordRecoveryModal {...defaultProps} loading={true} />);

    const submitBtn = screen.getByRole('button', { name: /Processing\.\.\./i });
    expect(submitBtn).toBeDisabled();
  });
});
