import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Hotel, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getRedirectPath = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return '/admin';
      case 'staff':
        return '/staff';
      case 'guest':
        return '/app';
      default:
        return '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const { user } = await login(formData.email, formData.password);
      
      // Determine redirect path based on user role
      let redirectPath = from;
      
      // If coming from home page or login page, redirect based on role
      if (from === '/' || from === '/login') {
        redirectPath = getRedirectPath(user.role);
      } else {
        // If coming from a specific page, check if user has access
        const pathSegments = from.split('/');
        const firstSegment = pathSegments[1];
        
        // If trying to access admin area but not admin, redirect to appropriate dashboard
        if (firstSegment === 'admin' && user.role !== 'admin') {
          redirectPath = getRedirectPath(user.role);
        }
        // If trying to access staff area but not staff, redirect to appropriate dashboard
        else if (firstSegment === 'staff' && user.role !== 'staff') {
          redirectPath = getRedirectPath(user.role);
        }
        // If trying to access guest area but not guest, redirect to appropriate dashboard
        else if (firstSegment === 'app' && user.role !== 'guest') {
          redirectPath = getRedirectPath(user.role);
        }
        // Otherwise, allow access to the intended page
        else {
          redirectPath = from;
        }
      }
      
      navigate(redirectPath, { replace: true });
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Hotel className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              name="email"
              type="email"
              label="Email address"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="Enter your email"
            />

            <div className="relative">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center mt-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p><strong>Admin:</strong> admin@hotel.com / admin123</p>
              <p><strong>Staff:</strong> staff@hotel.com / staff123</p>
              <p><strong>Guest:</strong> john@example.com / guest123</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}