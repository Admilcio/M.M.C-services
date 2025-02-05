import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Cake, Clock } from 'lucide-react';

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center h-auto py-2">
          {/* Logo */}
          <div className="flex items-center mb-2 sm:mb-0">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                src="https://i.imgur.com/4kcohT7.jpeg"
                alt="M.M.C Logo"
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">M.M.C</span>
            </Link>
          </div>

          {/* Links */}
          <div className="flex items-center justify-center space-x-4">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                location.pathname === '/'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'hover:bg-indigo-50 text-gray-600'
              }`}
            >
              <Heart className="h-4 w-4" />
              <span>Services</span>
            </Link>
            <Link
              to="/pastries"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                location.pathname === '/pastries'
                  ? 'bg-rose-100 text-rose-700'
                  : 'hover:bg-rose-50 text-gray-600'
              }`}
            >
              <Cake className="h-4 w-4" />
              <span>Pastries</span>
            </Link>
          </div>

          {/* Clock */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2 sm:mt-0">
            <Clock className="inline-block w-4 h-4" />
            <span>7:00 AM - 6:00 PM</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
