// Authentication utility functions
export const AUTH_CREDENTIALS = {
  ADMIN: {
    email: 'admin@hotel.com',
    password: 'admin123'
  },
  GUEST: {
    email: 'john@example.com', 
    password: 'guest123'
  }
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('token');
};

export const loginAsAdmin = async (): Promise<string> => {
  try {
    const response = await fetch('http://localhost:4000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AUTH_CREDENTIALS.ADMIN),
    });

    const data = await response.json();
    
    if (data.status === 'success' && data.token) {
      setAuthToken(data.token);
      return data.token;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const loginAsGuest = async (): Promise<string> => {
  try {
    const response = await fetch('http://localhost:4000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AUTH_CREDENTIALS.GUEST),
    });

    const data = await response.json();
    
    if (data.status === 'success' && data.token) {
      setAuthToken(data.token);
      return data.token;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Auto-login for demo purposes
export const ensureAuthenticated = async (): Promise<string> => {
  const existingToken = getAuthToken();
  if (existingToken) {
    return existingToken;
  }

  // Try to auto-login as admin for demo
  try {
    return await loginAsAdmin();
  } catch (error) {
    console.error('Auto-login failed:', error);
    throw new Error('Authentication required');
  }
};