'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, AlertTriangle, Inbox, Building2, Plane, PlaneTakeoff, Users, Luggage, Ticket, CalendarDays, Home, LogOut, Shield } from 'lucide-react';

// ── Reusable helpers ──────────────────────────────
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

function ConfirmDialog({ message, sub, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal animate-in" onClick={e => e.stopPropagation()}>
        <div className="confirm-dialog">
          <div className="icon"><AlertTriangle size={48} className="text-danger" /></div>
          <div className="message">{message}</div>
          <div className="sub-message">{sub}</div>
          <div className="actions">
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataTable({ columns, data, actions }) {
  if (!data.length) return <div className="empty-state"><div className="icon"><Inbox size={48} /></div><div className="message">No records found</div></div>;
  return (
    <>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}{actions && <th>Actions</th>}</tr></thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map(c => <td key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? '—')}</td>)}
                {actions && <td><div className="btn-group">{actions(row)}</div></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-count">{data.length} record(s)</div>
    </>
  );
}

function Loading() {
  return <div className="loading-overlay"><div className="spinner" /></div>;
}

function EmployeeLogin({ onLogin, toast }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.username.trim() || !form.password) return toast('Enter your username and password', 'error');
    setLoading(true);
    try {
      const data = await api('/api/auth/employee/login', { method: 'POST', body: form });
      onLogin(data.employee);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  };

  return (
    <div className="login-container animate-in">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--color-primary)' }}><Shield size={48} /></div>
        <h1 className="page-title">Employee Panel</h1>
        <p className="page-subtitle">Sign in with your staff username and password</p>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            className="form-input"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            placeholder="Staff username"
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="Password"
            autoComplete="current-password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link href="/" className="nav-link" style={{ color: 'var(--text-muted)' }}>Back to Home</Link>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  EMPLOYEE PAGE
// ══════════════════════════════════════════════
const SECTIONS = [
  { key: 'airports', icon: <Building2 size={16} />, label: 'Airports' },
  { key: 'flights', icon: <Plane size={16} />, label: 'Flights' },
  { key: 'planes', icon: <PlaneTakeoff size={16} />, label: 'Planes' },
  { key: 'employees', icon: <Users size={16} />, label: 'Employees' },
  { key: 'passengers', icon: <Luggage size={16} />, label: 'Passengers' },
  { key: 'bookings', icon: <Ticket size={16} />, label: 'Bookings' },
  { key: 'schedule', icon: <CalendarDays size={16} />, label: 'Schedule' },
];

export default function EmployeePage() {
  const [section, setSection] = useState('airports');
  const [toast, setToast] = useState(null);
  const [staff, setStaff] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) return;
        const data = await response.json();
        if (active && data.role === 'employee') setStaff(data.employee);
      } catch {
        // Missing session shows the staff login screen.
      } finally {
        if (active) setCheckingSession(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setStaff(null);
    }
  };

  if (checkingSession) return <Loading />;

  if (!staff) {
    return (
      <>
        <EmployeeLogin onLogin={setStaff} toast={showToast} />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <div className="page-container">
      <div className="panel-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div style={{ padding: '0 0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Staff session</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{staff.display_name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{staff.username}</div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Management</div>
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
            <div className="sidebar-label">Navigation</div>
            <button className="sidebar-link" onClick={handleLogout}><span className="icon"><LogOut size={16} /></span> Logout</button>
            <Link href="/" className="sidebar-link"><span className="icon"><Home size={16} /></span> Home</Link>
          </div>
        </div>

        {/* Content */}
        <div className="panel-content animate-in" key={section}>
          {section === 'airports' && <AirportsSection toast={showToast} />}
          {section === 'flights' && <FlightsSection toast={showToast} />}
          {section === 'planes' && <PlanesSection toast={showToast} />}
          {section === 'employees' && <EmployeesSection toast={showToast} />}
          {section === 'passengers' && <PassengersSection toast={showToast} />}
          {section === 'bookings' && <BookingsSection />}
          {section === 'schedule' && <ScheduleSection />}
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────
// AIRPORTS SECTION
// ─────────────────────────────────────────
function AirportsSection({ toast }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | null
  const [editRow, setEditRow] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ airport_id: '', name: '', city: '', address: '', contacts: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api('/api/airports')); } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      if (modal === 'add') {
        await api('/api/airports', { method: 'POST', body: { ...form, contacts: form.contacts ? form.contacts.split(',').map(s => s.trim()) : [] } });
        toast('Airport added!');
      } else {
        await api(`/api/airports/${editRow.airport_id}`, { method: 'PUT', body: form });
        toast('Airport updated!');
      }
      setModal(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await api(`/api/airports/${id}`, { method: 'DELETE' });
      toast('Airport deleted!');
      setConfirm(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const openEdit = (row) => {
    setEditRow(row);
    setForm({ airport_id: row.airport_id, name: row.name, city: row.city, address: row.address, contacts: '' });
    setModal('edit');
  };

  const openAdd = () => {
    setForm({ airport_id: '', name: '', city: '', address: '', contacts: '' });
    setModal('add');
  };

  const columns = [
    { key: 'airport_id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'city', label: 'City' },
    { key: 'address', label: 'Address' },
    { key: 'contacts', label: 'Contacts', render: r => r.contacts || <span style={{ color: 'var(--text-muted)' }}>—</span> },
  ];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="card-header" style={{ border: 'none', padding: 0 }}>
        <div>
          <h1 className="page-title">Airports</h1>
          <p className="page-subtitle">Manage all airport records</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Airport</button>
      </div>
      <DataTable columns={columns} data={data} actions={(row) => (
        <>
          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(row)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => setConfirm(row)}>Delete</button>
        </>
      )} />

      {modal && (
        <Modal title={modal === 'add' ? 'Add Airport' : 'Edit Airport'} onClose={() => setModal(null)}>
          <div className="form-group">
            <label className="form-label">Airport ID</label>
            <input className="form-input" value={form.airport_id} onChange={e => setForm({ ...form, airport_id: e.target.value })} disabled={modal === 'edit'} placeholder="e.g. AP001" />
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Airport name" />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City name" />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
          </div>
          {modal === 'add' && (
            <div className="form-group">
              <label className="form-label">Contact Numbers</label>
              <input className="form-input" value={form.contacts} onChange={e => setForm({ ...form, contacts: e.target.value })} placeholder="Comma-separated (optional)" />
              <div className="form-hint">e.g. 9876543210, 1234567890</div>
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>{modal === 'add' ? 'Add Airport' : 'Save Changes'}</button>
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          message={`Delete airport ${confirm.airport_id}?`}
          sub="This will also remove linked contacts. Flights may be affected."
          onCancel={() => setConfirm(null)}
          onConfirm={() => handleDelete(confirm.airport_id)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// FLIGHTS SECTION
// ─────────────────────────────────────────
function FlightsSection({ toast }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ flight_id: '', arrival_time: '', departure_time: '', source_airport_id: '', dest_airport_id: '', plane_id: '', dates: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api('/api/flights')); } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      if (modal === 'add') {
        await api('/api/flights', { method: 'POST', body: { ...form, dates: form.dates ? form.dates.split(',').map(s => s.trim()) : [] } });
        toast('Flight added!');
      } else {
        await api(`/api/flights/${editRow.flight_id}`, { method: 'PUT', body: form });
        toast('Flight updated!');
      }
      setModal(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await api(`/api/flights/${id}`, { method: 'DELETE' });
      toast('Flight deleted!');
      setConfirm(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const openEdit = (row) => {
    setEditRow(row);
    setForm({ flight_id: row.flight_id, arrival_time: row.arrival_time || '', departure_time: row.departure_time || '', plane_id: '', source_airport_id: '', dest_airport_id: '', dates: '' });
    setModal('edit');
  };

  const openAdd = () => {
    setForm({ flight_id: '', arrival_time: '', departure_time: '', source_airport_id: '', dest_airport_id: '', plane_id: '', dates: '' });
    setModal('add');
  };

  const formatTime = (t) => {
    if (!t) return '—';
    if (typeof t === 'string' && t.includes(':')) return t.substring(0, 5);
    return String(t);
  };

  const columns = [
    { key: 'flight_id', label: 'Flight' },
    { key: 'source', label: 'From' },
    { key: 'destination', label: 'To' },
    { key: 'departure_time', label: 'Depart', render: r => formatTime(r.departure_time) },
    { key: 'arrival_time', label: 'Arrive', render: r => formatTime(r.arrival_time) },
    { key: 'plane', label: 'Plane' },
    { key: 'dates_scheduled', label: 'Dates', render: r => <span className="badge badge-info">{r.dates_scheduled}</span> },
    { key: 'passengers_booked', label: 'Passengers', render: r => <span className="badge badge-success">{r.passengers_booked}</span> },
  ];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="card-header" style={{ border: 'none', padding: 0 }}>
        <div><h1 className="page-title">Flights</h1><p className="page-subtitle">Manage flight routes and schedules</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Flight</button>
      </div>
      <DataTable columns={columns} data={data} actions={(row) => (
        <>
          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(row)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => setConfirm(row)}>Delete</button>
        </>
      )} />

      {modal && (
        <Modal title={modal === 'add' ? 'Add Flight' : 'Edit Flight'} onClose={() => setModal(null)}>
          {modal === 'add' && (
            <div className="form-group">
              <label className="form-label">Flight ID</label>
              <input className="form-input" value={form.flight_id} onChange={e => setForm({ ...form, flight_id: e.target.value })} placeholder="e.g. FL001" />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Departure Time</label>
              <input className="form-input" type="time" value={form.departure_time} onChange={e => setForm({ ...form, departure_time: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Arrival Time</label>
              <input className="form-input" type="time" value={form.arrival_time} onChange={e => setForm({ ...form, arrival_time: e.target.value })} />
            </div>
          </div>
          {modal === 'add' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Source Airport ID</label>
                  <input className="form-input" value={form.source_airport_id} onChange={e => setForm({ ...form, source_airport_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Dest Airport ID</label>
                  <input className="form-input" value={form.dest_airport_id} onChange={e => setForm({ ...form, dest_airport_id: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Plane ID</label>
                <input className="form-input" value={form.plane_id} onChange={e => setForm({ ...form, plane_id: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Flight Dates</label>
                <input className="form-input" value={form.dates} onChange={e => setForm({ ...form, dates: e.target.value })} placeholder="YYYY-MM-DD, YYYY-MM-DD, ..." />
                <div className="form-hint">Comma-separated dates (optional)</div>
              </div>
            </>
          )}
          {modal === 'edit' && (
            <div className="form-group">
              <label className="form-label">New Plane ID</label>
              <input className="form-input" value={form.plane_id} onChange={e => setForm({ ...form, plane_id: e.target.value })} placeholder="Leave blank to keep current" />
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>{modal === 'add' ? 'Add Flight' : 'Save Changes'}</button>
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          message={`Delete flight ${confirm.flight_id}?`}
          sub="This will remove all bookings, dates, and crew assignments for this flight."
          onCancel={() => setConfirm(null)}
          onConfirm={() => handleDelete(confirm.flight_id)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// PLANES SECTION
// ─────────────────────────────────────────
function PlanesSection({ toast }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ p_id: '', capacity: '', model_no: '', license_no: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api('/api/planes')); } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      if (modal === 'add') {
        await api('/api/planes', { method: 'POST', body: form });
        toast('Plane added!');
      } else {
        await api(`/api/planes/${editRow.p_id}`, { method: 'PUT', body: form });
        toast('Plane updated!');
      }
      setModal(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await api(`/api/planes/${id}`, { method: 'DELETE' });
      toast('Plane deleted!');
      setConfirm(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const openEdit = (row) => {
    setEditRow(row);
    setForm({ p_id: row.p_id, capacity: '', model_no: '', license_no: '' });
    setModal('edit');
  };

  const openAdd = () => {
    setForm({ p_id: '', capacity: '', model_no: '', license_no: '' });
    setModal('add');
  };

  const columns = [
    { key: 'p_id', label: 'ID' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'model_no', label: 'Model' },
    { key: 'license_no', label: 'License' },
    { key: 'flights_assigned', label: 'Flights', render: r => <span className="badge badge-info">{r.flights_assigned}</span> },
  ];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="card-header" style={{ border: 'none', padding: 0 }}>
        <div><h1 className="page-title">Planes</h1><p className="page-subtitle">Manage aircraft fleet</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Plane</button>
      </div>
      <DataTable columns={columns} data={data} actions={(row) => (
        <>
          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(row)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => setConfirm(row)}>Delete</button>
        </>
      )} />

      {modal && (
        <Modal title={modal === 'add' ? 'Add Plane' : 'Edit Plane'} onClose={() => setModal(null)}>
          <div className="form-group">
            <label className="form-label">Plane ID</label>
            <input className="form-input" value={form.p_id} onChange={e => setForm({ ...form, p_id: e.target.value })} disabled={modal === 'edit'} placeholder="e.g. PL001" />
          </div>
          <div className="form-group">
            <label className="form-label">Capacity</label>
            <input className="form-input" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder={modal === 'edit' ? 'Leave blank to skip' : 'Number of seats'} />
          </div>
          <div className="form-group">
            <label className="form-label">Model Number</label>
            <input className="form-input" value={form.model_no} onChange={e => setForm({ ...form, model_no: e.target.value })} placeholder={modal === 'edit' ? 'Leave blank to skip' : 'e.g. Boeing 737'} />
          </div>
          <div className="form-group">
            <label className="form-label">License Number</label>
            <input className="form-input" value={form.license_no} onChange={e => setForm({ ...form, license_no: e.target.value })} placeholder={modal === 'edit' ? 'Leave blank to skip' : 'License number'} />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>{modal === 'add' ? 'Add Plane' : 'Save Changes'}</button>
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          message={`Delete plane ${confirm.p_id}?`}
          sub="Flights using this plane may be affected."
          onCancel={() => setConfirm(null)}
          onConfirm={() => handleDelete(confirm.p_id)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// EMPLOYEES SECTION
// ─────────────────────────────────────────
function EmployeesSection({ toast }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [flightsModal, setFlightsModal] = useState(null);
  const [empFlights, setEmpFlights] = useState([]);
  const [form, setForm] = useState({ e_id: '', name: '', designation: '', contacts: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api('/api/employees')); } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      if (modal === 'add') {
        await api('/api/employees', { method: 'POST', body: { ...form, contacts: form.contacts ? form.contacts.split(',').map(s => s.trim()) : [] } });
        toast('Employee added!');
      } else {
        await api(`/api/employees/${editRow.e_id}`, { method: 'PUT', body: form });
        toast('Employee updated!');
      }
      setModal(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await api(`/api/employees/${id}`, { method: 'DELETE' });
      toast('Employee deleted!');
      setConfirm(null);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const viewFlights = async (row) => {
    try {
      const flights = await api(`/api/employees/${row.e_id}/flights`);
      setEmpFlights(flights);
      setFlightsModal(row);
    } catch (e) { toast(e.message, 'error'); }
  };

  const openEdit = (row) => {
    setEditRow(row);
    setForm({ e_id: row.e_id, name: row.name, designation: row.designation || '', contacts: '' });
    setModal('edit');
  };

  const openAdd = () => {
    setForm({ e_id: '', name: '', designation: '', contacts: '' });
    setModal('add');
  };

  const columns = [
    { key: 'e_id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'designation', label: 'Designation', render: r => r.designation ? <span className="badge badge-info">{r.designation}</span> : '—' },
    { key: 'contacts', label: 'Contacts', render: r => r.contacts || <span style={{ color: 'var(--text-muted)' }}>—</span> },
  ];

  if (loading) return <Loading />;

  return (
    <div>
      <div className="card-header" style={{ border: 'none', padding: 0 }}>
        <div><h1 className="page-title">Employees</h1><p className="page-subtitle">Manage staff records</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Employee</button>
      </div>
      <DataTable columns={columns} data={data} actions={(row) => (
        <>
          <button className="btn btn-sm btn-secondary" onClick={() => viewFlights(row)} title="View Flights"><Plane size={16} /></button>
          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(row)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => setConfirm(row)}>Delete</button>
        </>
      )} />

      {modal && (
        <Modal title={modal === 'add' ? 'Add Employee' : 'Edit Employee'} onClose={() => setModal(null)}>
          <div className="form-group">
            <label className="form-label">Employee ID</label>
            <input className="form-input" value={form.e_id} onChange={e => setForm({ ...form, e_id: e.target.value })} disabled={modal === 'edit'} placeholder="e.g. E001" />
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label className="form-label">Designation</label>
            <input className="form-input" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Pilot, Attendant" />
          </div>
          {modal === 'add' && (
            <div className="form-group">
              <label className="form-label">Contact Numbers</label>
              <input className="form-input" value={form.contacts} onChange={e => setForm({ ...form, contacts: e.target.value })} placeholder="Comma-separated (optional)" />
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>{modal === 'add' ? 'Add Employee' : 'Save Changes'}</button>
          </div>
        </Modal>
      )}

      {flightsModal && (
        <Modal title={`Flight Assignments — ${flightsModal.name}`} onClose={() => setFlightsModal(null)}>
          {empFlights.length ? (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Flight</th><th>From</th><th>To</th><th>Depart</th><th>Arrive</th></tr></thead>
                <tbody>
                  {empFlights.map((f, i) => (
                    <tr key={i}>
                      <td>{f.flight_id}</td><td>{f.from_city}</td><td>{f.to_city}</td>
                      <td>{f.departure_time}</td><td>{f.arrival_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="empty-state"><div className="icon"><Plane size={48} /></div><div className="message">No flight assignments</div></div>}
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          message={`Delete employee ${confirm.e_id}?`}
          sub="This will remove contacts and flight assignments."
          onCancel={() => setConfirm(null)}
          onConfirm={() => handleDelete(confirm.e_id)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// PASSENGERS SECTION (read-only for employee)
// ─────────────────────────────────────────
function PassengersSection({ toast }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setData(await api('/api/passengers')); } catch (e) { toast(e.message, 'error'); }
      setLoading(false);
    })();
  }, [toast]);

  const columns = [
    { key: 'p_id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'address', label: 'Address' },
    { key: 'contacts', label: 'Contacts', render: r => r.contacts || '—' },
    { key: 'flights_booked', label: 'Flights', render: r => <span className="badge badge-success">{r.flights_booked}</span> },
  ];

  if (loading) return <Loading />;
  return (
    <div>
      <div><h1 className="page-title">Passengers</h1><p className="page-subtitle">All registered passengers</p></div>
      <div style={{ marginTop: '1.5rem' }}><DataTable columns={columns} data={data} /></div>
    </div>
  );
}

// ─────────────────────────────────────────
// BOOKINGS SECTION (read-only)
// ─────────────────────────────────────────
function BookingsSection() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setData(await api('/api/bookings')); } catch { }
      setLoading(false);
    })();
  }, []);

  const formatTime = (t) => {
    if (!t) return '—';
    if (typeof t === 'string' && t.includes(':')) return t.substring(0, 5);
    return String(t);
  };

  const columns = [
    { key: 'flight_id', label: 'Flight' },
    { key: 'passenger', label: 'Passenger' },
    { key: 'p_id', label: 'Pass. ID' },
    { key: 'from_city', label: 'From' },
    { key: 'to_city', label: 'To' },
    { key: 'departure_time', label: 'Depart', render: r => formatTime(r.departure_time) },
    { key: 'arrival_time', label: 'Arrive', render: r => formatTime(r.arrival_time) },
  ];

  if (loading) return <Loading />;
  return (
    <div>
      <div><h1 className="page-title">Bookings</h1><p className="page-subtitle">All flight bookings</p></div>
      <div style={{ marginTop: '1.5rem' }}><DataTable columns={columns} data={data} /></div>
    </div>
  );
}

// ─────────────────────────────────────────
// SCHEDULE SECTION
// ─────────────────────────────────────────
function ScheduleSection() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setData(await api('/api/schedule')); } catch { }
      setLoading(false);
    })();
  }, []);

  const formatTime = (t) => {
    if (!t) return '—';
    if (typeof t === 'string' && t.includes(':')) return t.substring(0, 5);
    return String(t);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return String(d); }
  };

  const columns = [
    { key: 'flight_id', label: 'Flight' },
    { key: 'from_city', label: 'From' },
    { key: 'to_city', label: 'To' },
    { key: 'departure_time', label: 'Depart', render: r => formatTime(r.departure_time) },
    { key: 'arrival_time', label: 'Arrive', render: r => formatTime(r.arrival_time) },
    { key: 'flight_date', label: 'Date', render: r => <span className="badge badge-warning">{formatDate(r.flight_date)}</span> },
    { key: 'plane', label: 'Plane' },
  ];

  if (loading) return <Loading />;
  return (
    <div>
      <div><h1 className="page-title">Flight Schedule</h1><p className="page-subtitle">All scheduled flight dates</p></div>
      <div style={{ marginTop: '1.5rem' }}><DataTable columns={columns} data={data} /></div>
    </div>
  );
}
