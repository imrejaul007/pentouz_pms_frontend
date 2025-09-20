import React from 'react';
import { Hotel, Phone, Mail, MapPin } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Hotel className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">THE PENTOUZ</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Experience luxury and comfort at THE PENTOUZ. You are in a city where people are never bored. Immerse yourself in local art exhibitions, neighbourhood events, seasonal activities and numerous parks.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-300 hover:text-white transition-colors">Home</a></li>
              <li><a href="/rooms" className="text-gray-300 hover:text-white transition-colors">Rooms</a></li>
              <li><a href="/reviews" className="text-gray-300 hover:text-white transition-colors">Reviews</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">+91 888 444 9930</span>
             
              </div>
               <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-400" />
              
                 <span className="text-gray-300">+91 897 029 8300</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">E-mail: sales@pentouz.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">46, 6th Cross, Lavelle Road, Bangalore - 560001. India.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 THE PENTOUZ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}