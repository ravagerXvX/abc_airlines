'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Luggage, Plane, Ticket, ClipboardList, User, LogOut, Home, PlaneTakeoff, Armchair, Calendar, Clock } from 'lucide-react';

const api = async (url, opts = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const raw = await res.text();
  let data = {};

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: raw || 'Unexpected server response' };
    }
  }

  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast toast-${type}`}>{type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />} {msg}</div>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-in" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>{title}</h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Loading() {
  return <div className="loading-overlay"><div className="spinner" /></div>;
}

// ══════════════════════════════════════════════
//  PASSENGER PAGE — LOGIN + DASHBOARD
// ══════════════════════════════════════════════
export default function PassengerPage() {
  const [passenger, setPassenger] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) return;
        const data = await response.json();
        if (active && data.role === 'passenger') setPassenger(data.passenger);
      } catch {
        // A missing or expired session simply shows the Google sign-in screen.
      } finally {
        if (active) setCheckingSession(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (checkingSession) return <Loading />;

  if (!passenger) {
    return (
      <>
        <PassengerSignInChoice onLogin={setPassenger} toast={showToast} />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  if (passenger.needs_profile) {
    return (
      <>
        <CompleteProfile
          passenger={passenger}
          onComplete={setPassenger}
          toast={showToast}
          onLogout={() => setPassenger(null)}
        />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <>
      <PassengerDashboard passenger={passenger} onPassengerChange={setPassenger} onLogout={() => setPassenger(null)} toast={showToast} />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}

function PassengerSignInChoice({ onLogin, toast }) {
  return (
    <div className="login-container animate-in">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--color-primary)' }}><Luggage size={48} /></div>
        <h1 className="page-title">Passenger Portal</h1>
        <p className="page-subtitle">Sign in with Google to access your flights</p>
      </div>

      <div className="card">
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 0 }}>
          Continue with Google to access your passenger account and manage bookings securely.
        </p>

        <a className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} href="/api/auth/google">
          <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>G</span> Continue with Google
        </a>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link href="/" className="nav-link" style={{ color: 'var(--text-muted)' }}>Back to Home</Link>
      </div>
    </div>
  );
}

function GoogleSignIn() {
  return (
    <div className="login-container animate-in">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--color-primary)' }}><Luggage size={48} /></div>
        <h1 className="page-title">Passenger Portal</h1>
        <p className="page-subtitle">Sign in securely to manage your flights</p>
      </div>

      <div className="card">
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 0 }}>
          Continue with your Google account. Your passenger ID is generated automatically the first time you sign in and stays the same for future logins.
        </p>
        <a className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} href="/api/auth/google">
          <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>G</span> Continue with Google
        </a>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link href="/" className="nav-link" style={{ color: 'var(--text-muted)' }}>Back to Home</Link>
      </div>
    </div>
  );
}

function CompleteProfile({ passenger, onComplete, toast, onLogout }) {
  const [form, setForm] = useState({ address: '', contact_no: '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.address.trim() || !form.contact_no.trim()) {
      return toast('Address and phone number are required', 'error');
    }
    setLoading(true);
    try {
      const data = await api(`/api/passengers/${passenger.p_id}`, {
        method: 'PUT',
        body: { address: form.address.trim(), contact_no: form.contact_no.trim() },
      });
      toast('Your details were saved.');
      onComplete(data.passenger);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      onLogout();
    }
  };

  return (
    <div className="login-container animate-in">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--color-primary)' }}><User size={48} /></div>
        <h1 className="page-title">Complete your profile</h1>
        <p className="page-subtitle">Google signed you in as {passenger.name}. Add the details stored on your passenger record.</p>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Address</label>
          <input
            className="form-input"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            placeholder="Home or mailing address"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone number</label>
          <input
            className="form-input"
            value={form.contact_no}
            onChange={e => setForm({ ...form, contact_no: e.target.value })}
            placeholder="Contact number"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save and continue'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button className="nav-link" style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={handleLogout}>Sign out</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// PASSENGER DASHBOARD
// ─────────────────────────────────────────
function PassengerDashboard({ passenger, onPassengerChange, onLogout, toast }) {
  const [section, setSection] = useState('flights');

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      onLogout();
    }
  };

  const SECTIONS = [
    { key: 'flights', icon: <Plane size={16} />, label: 'Browse Flights' },
    { key: 'book', icon: <Ticket size={16} />, label: 'Book a Flight' },
    { key: 'bookings', icon: <ClipboardList size={16} />, label: 'My Bookings' },
    { key: 'profile', icon: <User size={16} />, label: 'My Profile' },
  ];

  return (
    <div className="page-container">
      <div className="panel-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div style={{ padding: '0 0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Logged in as</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{passenger.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {passenger.p_id}</div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Navigation</div>
            {SECTIONS.map(s => (
              <button
                key={s.key}
                className={`sidebar-link ${section === s.key ? 'active' : ''}`}
                onClick={() => setSection(s.key)}
              >
                <span className="icon">{s.icon}</span> {s.label}
              </button>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Account</div>
            <button className="sidebar-link" onClick={handleLogout}><span className="icon"><LogOut size={16} /></span> Logout</button>
            <Link href="/" className="sidebar-link"><span className="icon"><Home size={16} /></span> Home</Link>
          </div>
        </div>

        {/* Content */}
        <div className="panel-content animate-in" key={section}>
          {section === 'flights' && <BrowseFlights toast={toast} />}
          {section === 'book' && <BookFlight passenger={passenger} toast={toast} />}
          {section === 'bookings' && <MyBookings passenger={passenger} toast={toast} />}
          {section === 'profile' && <MyProfile passenger={passenger} onPassengerChange={onPassengerChange} toast={toast} />}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// BROWSE FLIGHTS
// ─────────────────────────────────────────
function BrowseFlights({ toast }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { setData(await api('/api/flights')); } catch (e) { toast(e.message, 'error'); }
      setLoading(false);
    })();
  }, [toast]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || window.google?.maps?.places) {
      if (window.google?.maps?.places) setGoogleReady(true);
      return;
    }

    const existing = document.getElementById('google-maps-script');
    if (existing) {
      const waitForMaps = setInterval(() => {
        if (window.google?.maps?.places) {
          setGoogleReady(true);
          clearInterval(waitForMaps);
        }
      }, 200);
      return () => clearInterval(waitForMaps);
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!googleReady || !searchInputRef.current || typeof window === 'undefined' || !window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      types: ['airport', 'geocode'],
      fields: ['formatted_address', 'name'],
    });

    const handlePlace = () => {
      const place = autocomplete.getPlace();
      const value = place?.formatted_address || place?.name || '';
      if (value) setSearch(value);
    };

    const listener = autocomplete.addListener('place_changed', handlePlace);
    return () => window.google.maps.event.removeListener(listener);
  }, [googleReady]);

  const filteredData = data.filter((f) => {
    if (!search.trim()) return true;
    const text = `${f.flight_id} ${f.source || ''} ${f.source_city || ''} ${f.destination || ''} ${f.dest_city || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const viewDetail = async (fid) => {
    try {
      const d = await api(`/api/flights/${fid}`);
      setDetail(d);
    } catch (e) { toast(e.message, 'error'); }
  };

  const formatTime = (t) => {
    if (!t) return '—';
    if (typeof t === 'string' && t.includes(':')) return t.substring(0, 5);
    return String(t);
  };

  const formatDate = (d) => {
    if (!d) return '?';
    try { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return String(d); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div><h1 className="page-title">Available Flights</h1><p className="page-subtitle">Browse all flights and their details</p></div>

      <div className="card" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Flight or airport search</label>
          <input
            ref={searchInputRef}
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={googleReady ? 'Search city, airport or flight ID...' : 'Search flight ID, source or destination...'}
          />
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {!filteredData.length ? (
          <div className="empty-state"><div className="icon"><Plane size={48} /></div><div className="message">No flights match your search</div></div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredData.map(f => (
              <div key={f.flight_id} className="card" style={{ cursor: 'pointer' }} onClick={() => viewDetail(f.flight_id)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Flight</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{f.flight_id}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>{f.source}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatTime(f.departure_time)}</div>
                      </div>
                      <div style={{ color: 'var(--accent)', fontWeight: 600 }}>→</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{f.destination}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatTime(f.arrival_time)}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="tag"><PlaneTakeoff size={14} /> {f.plane}</div>
                    <div className="tag"><Armchair size={14} /> {f.capacity}</div>
                    <div className="tag"><Calendar size={14} /> {f.dates_scheduled} date(s)</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detail && (
        <Modal title={`Flight ${detail.flight_id}`} onClose={() => setDetail(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="stat-card">
              <div className="stat-label">From</div>
              <div style={{ fontWeight: 700 }}>{detail.source}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{detail.source_city}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">To</div>
              <div style={{ fontWeight: 700 }}>{detail.destination}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{detail.dest_city}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="tag" style={{ justifyContent: 'center', padding: '0.5rem' }}><Clock size={14} /> Dep: {formatTime(detail.departure_time)}</div>
            <div className="tag" style={{ justifyContent: 'center', padding: '0.5rem' }}><Clock size={14} /> Arr: {formatTime(detail.arrival_time)}</div>
            <div className="tag" style={{ justifyContent: 'center', padding: '0.5rem' }}><PlaneTakeoff size={14} /> {detail.plane}</div>
          </div>
          {detail.dates?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div className="form-label">Scheduled Dates</div>
              <div className="tag-list">
                {detail.dates.map((d, i) => <span key={i} className="badge badge-warning"><Calendar size={12} style={{marginRight: 4}} /> {formatDate(d)}</span>)}
              </div>
            </div>
          )}
          {detail.crew?.length > 0 && (
            <div>
              <div className="form-label">Crew</div>
              <div className="tag-list">
                {detail.crew.map((c, i) => <span key={i} className="badge badge-info"><User size={12} style={{marginRight: 4}} /> {c.name} ({c.designation})</span>)}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// BOOK A FLIGHT
// ─────────────────────────────────────────
function BookFlight({ passenger, toast }) {
  const [flightId, setFlightId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    if (!flightId.trim()) return toast('Enter a Flight ID', 'error');
    setLoading(true);
    try {
      await api('/api/bookings', { method: 'POST', body: { flight_id: flightId } });
      toast(`Flight ${flightId} booked successfully!`);
      setFlightId('');
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  };

  return (
    <div>
      <div><h1 className="page-title">Book a Flight</h1><p className="page-subtitle">Enter a flight ID to book your seat</p></div>
      <div className="card" style={{ marginTop: '1.5rem', maxWidth: '480px' }}>
        <div className="form-group">
          <label className="form-label">Flight ID</label>
          <input
            className="form-input"
            value={flightId}
            onChange={e => setFlightId(e.target.value)}
            placeholder="e.g. FL001"
            onKeyDown={e => e.key === 'Enter' && handleBook()}
          />
          <div className="form-hint">Browse flights first to find the right ID</div>
        </div>
        <button className="btn btn-primary" onClick={handleBook} disabled={loading}>
          {loading ? (
            'Booking...'
          ) : (
            <>
              <Ticket size={16} />
              <span>Book Flight</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MY BOOKINGS
// ─────────────────────────────────────────
function MyBookings({ passenger, toast }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api(`/api/bookings/${passenger.p_id}`)); } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }, [passenger.p_id, toast]);

  useEffect(() => { load(); }, [load]);

  const cancelBooking = async (fid) => {
    if (!confirm(`Cancel booking on flight ${fid}?`)) return;
    try {
      await api('/api/bookings', { method: 'DELETE', body: { flight_id: fid } });
      toast('Booking cancelled.');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const formatTime = (t) => {
    if (!t) return '—';
    if (typeof t === 'string' && t.includes(':')) return t.substring(0, 5);
    return String(t);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div><h1 className="page-title">My Bookings</h1><p className="page-subtitle">Your current flight reservations</p></div>

      <div style={{ marginTop: '1.5rem' }}>
        {!data.length ? (
          <div className="empty-state">
            <div className="icon"><Ticket size={48} /></div>
            <div className="message">No bookings yet</div>
            <div className="hint">Book a flight to see it here</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {data.map(b => (
              <div key={b.flight_id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Flight</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{b.flight_id}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>{b.from_city}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatTime(b.departure_time)}</div>
                      </div>
                      <div style={{ color: 'var(--accent)', fontWeight: 600 }}>→</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{b.to_city}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatTime(b.arrival_time)}</div>
                      </div>
                    </div>
                    <div className="tag"><PlaneTakeoff size={14} /> {b.plane}</div>
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => cancelBooking(b.flight_id)}>Cancel</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MY PROFILE
// ─────────────────────────────────────────
function MyProfile({ passenger, onPassengerChange, toast }) {
  const [form, setForm] = useState({
    name: passenger.name || '',
    address: passenger.address && passenger.address !== 'Not provided' ? passenger.address : '',
    contact_no: passenger.contacts || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.address.trim() || !form.contact_no.trim()) {
      return toast('Address and phone number are required', 'error');
    }
    setSaving(true);
    try {
      const data = await api(`/api/passengers/${passenger.p_id}`, { method: 'PUT', body: form });
      if (data.passenger) onPassengerChange(data.passenger);
      toast('Profile updated!');
    } catch (e) { toast(e.message, 'error'); }
    setSaving(false);
  };

  return (
    <div>
      <div><h1 className="page-title">My Profile</h1><p className="page-subtitle">Update your personal information</p></div>
      <div className="card" style={{ marginTop: '1.5rem', maxWidth: '480px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}><User size={24} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{passenger.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {passenger.p_id} · {passenger.address || 'No address'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{passenger.contacts || 'No phone number'}</div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Home or mailing address" />
        </div>
        <div className="form-group">
          <label className="form-label">Phone number</label>
          <input className="form-input" value={form.contact_no} onChange={e => setForm({ ...form, contact_no: e.target.value })} placeholder="Contact number" />
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
