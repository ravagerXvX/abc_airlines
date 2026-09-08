import Link from 'next/link';
import { PlaneTakeoff, Shield, Luggage } from 'lucide-react';

export default function Home() {
  return (
    <div className="hero-section">
      <div className="hero-badge"><PlaneTakeoff size={14} style={{ marginRight: '0.4rem' }} /> Welcome aboard</div>
      <h1 className="hero-title">
        ABC Airlines
      </h1>
      <p className="hero-subtitle">
        Your complete airline reservation and management system.
        Choose your role below to get started.
      </p>

      <div className="role-cards">
        <Link href="/employee" className="role-card">
          <div className="role-icon employee"><Shield size={24} /></div>
          <h2>Employee</h2>
          <p>Sign in with staff credentials — manage airports, flights, planes, employees, passengers and bookings.</p>
          <div className="cta">Enter Employee Panel <span>→</span></div>
        </Link>

        <Link href="/passenger" className="role-card">
          <div className="role-icon passenger"><Luggage size={24} /></div>
          <h2>Passenger</h2>
          <p>Browse flights, make bookings, view your reservations and manage your profile.</p>
          <div className="cta">Enter Passenger Portal <span>→</span></div>
        </Link>
      </div>
    </div>
  );
}
