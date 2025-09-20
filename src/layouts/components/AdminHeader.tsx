import React from 'react';
import { Bell, User, Settings, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hidden sm:block">
            <Bell className="h-5 w-5" />
          </button>
          
          <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hidden sm:block">
            <Settings className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="h-8 w-8 bg-gray-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:inline-flex">
            Logout
          </Button>
          
          {/* Mobile logout button */}
          <Button variant="ghost" size="sm" onClick={logout} className="sm:hidden px-2">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}