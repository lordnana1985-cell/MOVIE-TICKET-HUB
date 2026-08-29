import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminTabToggle } from './useAdminTabToggle';

describe('useAdminTabToggle Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes to false when no url parameter or localStorage flag is set', () => {
    const { result } = renderHook(() => useAdminTabToggle());
    expect(result.current.showAdminTab).toBe(false);
    expect(result.current.logoClicks).toBe(0);
  });

  it('initializes to true when ?admin=true is present in query parameters', () => {
    window.history.replaceState({}, '', '/?admin=true');
    const { result } = renderHook(() => useAdminTabToggle());
    expect(result.current.showAdminTab).toBe(true);
  });

  it('initializes to true when localStorage flag is set', () => {
    localStorage.setItem('mt_hub_show_admin_tab', 'true');
    const { result } = renderHook(() => useAdminTabToggle());
    expect(result.current.showAdminTab).toBe(true);
  });

  it('increments logoClicks on click and toggles visibility on 5 clicks', () => {
    const { result } = renderHook(() => useAdminTabToggle());

    act(() => {
      result.current.handleLogoClick();
    });
    expect(result.current.logoClicks).toBe(1);
    expect(result.current.showAdminTab).toBe(false);

    act(() => {
      result.current.handleLogoClick();
      result.current.handleLogoClick();
      result.current.handleLogoClick();
    });
    expect(result.current.logoClicks).toBe(4);

    // 5th click triggers toggle
    act(() => {
      result.current.handleLogoClick();
    });
    expect(result.current.logoClicks).toBe(0);
    expect(result.current.showAdminTab).toBe(true);
    expect(localStorage.getItem('mt_hub_show_admin_tab')).toBe('true');
  });

  it('explicitly sets admin tab visibility and persists to localStorage', () => {
    const { result } = renderHook(() => useAdminTabToggle());

    act(() => {
      result.current.setAdminTabExplicitly(true);
    });
    expect(result.current.showAdminTab).toBe(true);
    expect(localStorage.getItem('mt_hub_show_admin_tab')).toBe('true');

    act(() => {
      result.current.setAdminTabExplicitly(false);
    });
    expect(result.current.showAdminTab).toBe(false);
    expect(localStorage.getItem('mt_hub_show_admin_tab')).toBe('false');
  });
});
