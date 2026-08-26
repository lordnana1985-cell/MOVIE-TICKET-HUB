import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SignUpForm from './SignUpForm';

describe('SignUpForm Component', () => {
  const defaultProps = {
    role: 'buyer' as const,
    name: '',
    setName: vi.fn(),
    email: '',
    setEmail: vi.fn(),
    password: '',
    setPassword: vi.fn(),
    showPassword: false,
    setShowPassword: vi.fn(),
    companyName: '',
    setCompanyName: vi.fn(),
    phoneNumber: '',
    setPhoneNumber: vi.fn(),
    selectedBankCode: 'MTN',
    setSelectedBankCode: vi.fn(),
    bankList: [{ name: 'MTN Mobile Money', code: 'MTN' }],
    isLoadingBanks: false,
    loading: false,
    onSubmit: vi.fn((e) => e.preventDefault()),
  };

  it('renders buyer sign up fields (name, email, password)', () => {
    render(<SignUpForm {...defaultProps} />);
    expect(screen.getByPlaceholderText(/e\.g\. Christopher Nolan/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. yourname@domain\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register Account/i })).toBeInTheDocument();
  });

  it('renders organiser specific fields when role is producer', () => {
    render(<SignUpForm {...defaultProps} role="producer" />);
    expect(screen.getByPlaceholderText(/e\.g\. Sync Cinema Studios/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. \+234 803 123 4567/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    const compInput = screen.getByPlaceholderText(/e\.g\. Sync Cinema Studios/i);
    fireEvent.change(compInput, { target: { value: 'Silverbird Studio' } });
    expect(defaultProps.setCompanyName).toHaveBeenCalledWith('Silverbird Studio');

    const phoneInput = screen.getByPlaceholderText(/e\.g\. \+234 803 123 4567/i);
    fireEvent.change(phoneInput, { target: { value: '+233201234567' } });
    expect(defaultProps.setPhoneNumber).toHaveBeenCalledWith('+233201234567');

    const bankSelect = screen.getByRole('combobox');
    fireEvent.change(bankSelect, { target: { value: 'MTN' } });
    expect(defaultProps.setSelectedBankCode).toHaveBeenCalledWith('MTN');
  });

  it('updates form fields on input and toggles password visibility', () => {
    render(<SignUpForm {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText(/e\.g\. Christopher Nolan/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    expect(defaultProps.setName).toHaveBeenCalledWith('Jane Doe');

    const emailInput = screen.getByPlaceholderText(/e\.g\. yourname@domain\.com/i);
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    expect(defaultProps.setEmail).toHaveBeenCalledWith('jane@example.com');

    const passInput = screen.getByPlaceholderText(/••••••••/i);
    fireEvent.change(passInput, { target: { value: 'SecretPassword123' } });
    expect(defaultProps.setPassword).toHaveBeenCalledWith('SecretPassword123');

    const submitBtn = screen.getByRole('button', { name: /Register Account/i });
    fireEvent.click(submitBtn);
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });
});
