import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ForgotPasswordForm from './ForgotPasswordForm';

describe('ForgotPasswordForm Component', () => {
  const defaultProps = {
    email: '',
    setEmail: vi.fn(),
    loading: false,
    onSubmit: vi.fn((e) => e.preventDefault()),
    onBackToLogin: vi.fn(),
  };

  it('renders email input and reset button', () => {
    render(<ForgotPasswordForm {...defaultProps} />);
    expect(screen.getByText(/Reset Your Password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/yourname@domain\.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Secure Reset Link/i })).toBeInTheDocument();
  });

  it('handles email input change and submission', () => {
    render(<ForgotPasswordForm {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText(/yourname@domain\.com/i);
    fireEvent.change(emailInput, { target: { value: 'reset@example.com' } });
    expect(defaultProps.setEmail).toHaveBeenCalledWith('reset@example.com');

    const form = screen.getByRole('button', { name: /Send Secure Reset Link/i }).closest('form')!;
    fireEvent.submit(form);
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('triggers onBackToLogin when back button is clicked', () => {
    render(<ForgotPasswordForm {...defaultProps} />);
    const backBtn = screen.getByRole('button', { name: /Back to Login Portal/i });
    fireEvent.click(backBtn);
    expect(defaultProps.onBackToLogin).toHaveBeenCalledTimes(1);
  });
});
