'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, User, Calendar } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/create', label: 'Create', icon: PlusSquare },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4">
      <div className="max-w-screen-md mx-auto">
        <ul className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
                            (pathname?.startsWith(item.href) && item.href !== '/home');
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`flex flex-col items-center p-2 ${
                    isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
} 