import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SubaccountSetup from './SubaccountSetup';
import { UserProfile } from '../../types';

describe('SubaccountSetup Component', () => {
  const mockUser: UserProfile = {
    id: 'prod-123',
    email: 'producer@cinema.com',
    role: 'producer',
    name: 'Producer Name',
    companyName: 'Cinema Pro',
    businessName: 'Cinema Pro Ltd',
    settlementBank: '044',
    accountNumber: '1234567890',
    paystackSubaccountCode: 'ACCT_test123',
    balance: 0,
  };

  const defaultProps = {
    user: mockUser,
    bankSubaccount: 'ACCT_test123',
    bankList: [{ name: 'Access Bank', code: '044' }],
    isLoadingBanks: false,
    isSubmittingSubaccount: false,
    subaccountError: '',
    subaccountSuccess: '',
    isEditingSubaccount: false,
    setIsEditingSubaccount: vi.fn(),
    setupCountry: 'NGN' as const,
    setSetupCountry: vi.fn(),
    setupBusinessName: 'Cinema Pro Ltd',
    setSetupBusinessName: vi.fn(),
    setupBankCode: '044',
    setSetupBankCode: vi.fn(),
    setupAccountNumber: '1234567890',
    setSetupAccountNumber: vi.fn(),
    showVerificationInput: false,
    userEnteredCode: '',
    setUserEnteredCode: vi.fn(),
    verificationError: '',
    resendCooldown: 0,
    handleResendCode: vi.fn(),
    handleCreateSubaccount: vi.fn((e) => e.preventDefault()),
    onCancelEdit: vi.fn(),
  };

  it('renders configured subaccount status and details when active', () => {
    render(<SubaccountSetup {...defaultProps} />);
    expect(screen.getByText(/80\/20 Payout Subaccount/i)).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('ACCT_test123')).toBeInTheDocument();
    const editBtn = screen.getByRole('button', { name: /Edit Payout Settlement Bank/i });
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);
    expect(defaultProps.setIsEditingSubaccount).toHaveBeenCalledWith(true);
  });

  it('renders form inputs when in editing mode and triggers callbacks', () => {
    render(<SubaccountSetup {...defaultProps} isEditingSubaccount={true} />);
    expect(screen.getByText(/Settlement Currency & Bank Location/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e\.g\. Silverbird Cinemas/i);
    fireEvent.change(nameInput, { target: { value: 'New Cinema Studio' } });
    expect(defaultProps.setSetupBusinessName).toHaveBeenCalledWith('New Cinema Studio');

    const accInput = screen.getByPlaceholderText(/e\.g\. 0244123456/i);
    fireEvent.change(accInput, { target: { value: '9876543210' } });
    expect(defaultProps.setSetupAccountNumber).toHaveBeenCalledWith('9876543210');

    const submitBtn = screen.getByRole('button', { name: /Register & Link Account/i });
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);
    expect(defaultProps.handleCreateSubaccount).toHaveBeenCalled();
  });

  it('renders verification code input when showVerificationInput is true', () => {
    render(
      <SubaccountSetup
        {...defaultProps}
        isEditingSubaccount={true}
        showVerificationInput={true}
        userEnteredCode="1234"
      />
    );
    expect(screen.getByText(/Secure Account Verification/i)).toBeInTheDocument();
    const codeInput = screen.getByPlaceholderText(/e.g. 1234/i);
    expect(codeInput).toBeInTheDocument();
    fireEvent.change(codeInput, { target: { value: '5678' } });
    expect(defaultProps.setUserEnteredCode).toHaveBeenCalledWith('5678');

    const verifyBtn = screen.getByRole('button', { name: /Verify & Save Changes/i });
    expect(verifyBtn).toBeInTheDocument();
    fireEvent.click(verifyBtn);
    expect(defaultProps.handleCreateSubaccount).toHaveBeenCalled();
  });
});
