import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { mockApiResponse, mockApiError, createMockUser } from '../setup';

// Mock the API service
vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

// Test component to access auth context
const TestComponent = () => {
  const { user, login, logout, isLoading } = useAuth();
  
  return (
    <div>
      <div data-testid="user-info">
        {user ? `${user.firstName} ${user.lastName}` : 'No user'}
      </div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not loading'}</div>
      <button onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should provide initial state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
  });

  it('should handle successful login', async () => {
    const mockUser = createMockUser();
    const mockResponse = {
      success: true,
      data: {
        user: mockUser,
        token: 'test-token'
      }
    };

    const { api } = await import('../../services/api');
    vi.mocked(api.post).mockResolvedValue({
      data: mockResponse
    } as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
  });

  it('should handle login failure', async () => {
    const { api } = await import('../../services/api');
    vi.mocked(api.post).mockRejectedValue(new Error('Login failed'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
    });
  });

  it('should handle logout', async () => {
    const mockUser = createMockUser();
    const mockResponse = {
      success: true,
      data: {
        user: mockUser,
        token: 'test-token'
      }
    };

    const { api } = await import('../../services/api');
    vi.mocked(api.post).mockResolvedValue({
      data: mockResponse
    } as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // First login
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');
    });

    // Then logout
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('should load user from localStorage on mount', async () => {
    const mockUser = createMockUser();
    localStorage.getItem.mockReturnValue('test-token');

    const { api } = await import('../../services/api');
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        data: mockUser
      }
    } as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');
    });
  });

  it('should handle invalid token on mount', async () => {
    localStorage.getItem.mockReturnValue('invalid-token');

    const { api } = await import('../../services/api');
    vi.mocked(api.get).mockRejectedValue(new Error('Invalid token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });
});
