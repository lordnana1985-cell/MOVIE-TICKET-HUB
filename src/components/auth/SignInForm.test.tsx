import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SignInForm from './SignInForm';

describe('SignInForm Component', () => {
  const defaultProps = {
    role: 'buyer' as const,
    email: '',
    setEmail: vi.fn(),
    password: '',
    setPassword: vi.fn(),
    showPassword: false,
    setShowPassword: vi.fn(),
    loading: false,
    onSubmit: vi.fn((e) => e.preventDefault()),
    onForgotPassword: vi.fn(),
  };

  it('renders email, password inputs, and submit button', () => {
    render(<SignInForm {...defaultProps} />);
    expect(screen.getByPlaceholderText(/e\.g\. yourname@domain\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Authenticate & Log In/i })).toBeInTheDocument();
  });

  it('calls setEmail and setPassword on change and triggers submit', () => {
    render(<SignInForm {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText(/e\.g\. yourname@domain\.com/i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    expect(defaultProps.setEmail).toHaveBeenCalledWith('user@example.com');

    const form = screen.getByRole('button', { name: /Authenticate & Log In/i }).closest('form')!;
    fireEvent.submit(form);
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('triggers onForgotPassword when clicked', () => {
    render(<SignInForm {...defaultProps} />);
    const forgotBtn = screen.getByRole('button', { name: /Forgot Password\?/i });
    fireEvent.click(forgotBtn);
    expect(defaultProps.onForgotPassword).toHaveBeenCalledTimes(1);
  });
});
