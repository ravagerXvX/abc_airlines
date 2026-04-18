import './globals.css';
import Link from 'next/link';
import { Plane } from 'lucide-react';

export const metadata = {
  title: 'ABC Airlines — Reservation System',
  description: 'Airline reservation and management system for ABC Airlines',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <Link href="/" className="navbar-brand">
            <div className="logo"><Plane size={24} strokeWidth={2.5} /></div>
            <div>
              <div className="brand-text">ABC Airlines</div>
              <div className="brand-sub">Reservation System</div>
            </div>
          </Link>
          <div className="navbar-right">
            <Link href="/employee" className="nav-link">Employee</Link>
            <Link href="/passenger" className="nav-link">Passenger</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
