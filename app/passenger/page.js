'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Luggage, Plane, Ticket, ClipboardList, User, LogOut, Home, PlaneTakeoff, Armchair, Calendar, Clock, Save } from 'lucide-react';

const api = async (url, opts = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
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
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  if (!passenger) {
    return (
      <>
        <LoginRegister onLogin={setPassenger} toast={showToast} />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <>
      <PassengerDashboard passenger={passenger} onLogout={() => setPassenger(null)} toast={showToast} />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}

// ─────────────────────────────────────────
// LOGIN / REGISTER
// ─────────────────────────────────────────
function LoginRegister({ onLogin, toast }) {
  const [tab, setTab] = useState('login');
  const [loginId, setLoginId] = useState('');
  const [regForm, setRegForm] = useState({ p_id: '', name: '', address: '', contact_no: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginId.trim()) return toast('Please enter your Passenger ID', 'error');
    setLoading(true);
    try {
      const p = await api(`/api/passengers/${loginId}`);
      onLogin(p);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!regForm.p_id || !regForm.name) return toast('ID and Name are required', 'error');
    setLoading(true);
    try {
      await api('/api/passengers', { method: 'POST', body: regForm });
      const p = await api(`/api/passengers/${regForm.p_id}`);
      toast(`Welcome, ${regForm.name}! Your ID is ${regForm.p_id}`);
      onLogin(p);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  };

  return (
    <div className="login-container animate-in">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--color-primary)' }}><Luggage size={48} /></div>
        <h1 className="page-title">Passenger Portal</h1>
        <p className="page-subtitle">Log in or register to manage your flights</p>
      </div>

      <div className="login-tabs">
        <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Log In</button>
        <button className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
      </div>

      <div className="card">
        {tab === 'login' ? (
          <>
            <div className="form-group">
              <label className="form-label">Passenger ID</label>
              <input
                className="form-input"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder="Enter your passenger ID"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Log In →'}
            </button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Choose a Passenger ID</label>
              <input className="form-input" value={regForm.p_id} onChange={e => setRegForm({ ...regForm, p_id: e.target.value })} placeholder="e.g. 101" />
              <div className="form-hint">Pick a unique numeric ID — remember it!</div>
            </div>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input className="form-input" value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={regForm.address} onChange={e => setRegForm({ ...regForm, address: e.target.value })} placeholder="Your address" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input className="form-input" value={regForm.contact_no} onChange={e => setRegForm({ ...regForm, contact_no: e.target.value })} placeholder="Optional" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleRegister} disabled={loading}>
              {loading ? 'Registering...' : 'Create Account →'}
            </button>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link href="/" className="nav-link" style={{ color: 'var(--text-muted)' }}>← Back to Home</Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// PASSENGER DASHBOARD
// ─────────────────────────────────────────
function PassengerDashboard({ passenger, onLogout, toast }) {
  const [section, setSection] = useState('flights');

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
            <button className="sidebar-link" onClick={onLogout}><span className="icon"><LogOut size={16} /></span> Logout</button>
            <Link href="/" className="sidebar-link"><span className="icon"><Home size={16} /></span> Home</Link>
          </div>
        </div>

        {/* Content */}
        <div className="panel-content animate-in" key={section}>
          {section === 'flights' && <BrowseFlights toast={toast} />}
          {section === 'book' && <BookFlight passenger={passenger} toast={toast} />}
          {section === 'bookings' && <MyBookings passenger={passenger} toast={toast} />}
          {section === 'profile' && <MyProfile passenger={passenger} toast={toast} />}
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

  useEffect(() => {
    (async () => {
      try { setData(await api('/api/flights')); } catch (e) { toast(e.message, 'error'); }
      setLoading(false);
    })();
  }, [toast]);

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

      <div style={{ marginTop: '1.5rem' }}>
        {!data.length ? (
          <div className="empty-state"><div className="icon"><Plane size={48} /></div><div className="message">No flights available</div></div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {data.map(f => (
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
      await api('/api/bookings', { method: 'POST', body: { flight_id: flightId, passenger_id: passenger.p_id } });
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
          {loading ? 'Booking...' : '<Ticket size={16} /> Book Flight'}
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
      await api('/api/bookings', { method: 'DELETE', body: { flight_id: fid, passenger_id: passenger.p_id } });
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
function MyProfile({ passenger, toast }) {
  const [form, setForm] = useState({ name: '', address: '', contact_no: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api(`/api/passengers/${passenger.p_id}`, { method: 'PUT', body: form });
      if (form.name) passenger.name = form.name;
      toast('Profile updated!');
      setForm({ name: '', address: '', contact_no: '' });
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
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">New Name</label>
          <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Leave blank to keep current" />
        </div>
        <div className="form-group">
          <label className="form-label">New Address</label>
          <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Leave blank to keep current" />
        </div>
        <div className="form-group">
          <label className="form-label">Add Contact Number</label>
          <input className="form-input" value={form.contact_no} onChange={e => setForm({ ...form, contact_no: e.target.value })} placeholder="Optional new contact" />
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '<Save size={16} /> Save Changes'}
        </button>
      </div>
    </div>
  );
}
