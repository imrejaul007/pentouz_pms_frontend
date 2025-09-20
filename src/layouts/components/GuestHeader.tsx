import React, { useState } from 'react';
import { Bell, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';

interface GuestHeaderProps {
  onMenuToggle?: () => void;
}

export default function GuestHeader({ onMenuToggle }: GuestHeaderProps) {
  const { user, logout } = useAuth();


  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button 
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 mr-3"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
            <span className="hidden sm:inline">THE PENTOUZ Portal</span>
            <span className="sm:hidden">PENTOUZ</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Static Notification Bell */}
          <div className="relative">
            <button className="relative p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
          </div>
          
          <div className="hidden sm:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.loyalty?.tier} Member</p>
            </div>
          </div>
          
          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="hidden sm:block"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}