import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState('approved');
  const [overrideRemark, setOverrideRemark] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideMsg, setOverrideMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/overview');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const students = (data?.students || []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = data?.students?.length ?? 0;
  const fullyApproved = data?.students?.filter(s => s.fullyApproved).length ?? 0;
  const withRejections = data?.students?.filter(s => s.rejected > 0).length ?? 0;

  const handleOverride = async () => {
    setOverrideLoading(true);
    setOverrideMsg('');
    try {
      await api.post('/api/admin/approve-override', {
        approvalId: overrideModal.approvalId,
        status: overrideStatus,
        remark: overrideRemark || 'Admin override',
      });
      setOverrideMsg('✅ Status updated successfully.');
      setTimeout(() => {
        setOverrideModal(null);
        fetchData();
      }, 1000);
    } catch (err) {
      setOverrideMsg(`❌ ${err.response?.data?.error || 'Override failed.'}`);
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main">

        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Overview</h1>
            <p className="page-sub">Welcome, {user?.name} · Full system visibility</p>
          </div>
          <button className="btn btn-ghost" onClick={fetchData} disabled={loading}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div>
              <div className="stat-value">{totalStudents}</div>
              <div className="stat-label">Total Students</div>
            </div>
          </div>
          <div className="stat-card approved">
            <div className="stat-icon">🏆</div>
            <div>
              <div className="stat-value">{fullyApproved}</div>
              <div className="stat-label">Fully Approved</div>
            </div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-icon">⚠️</div>
            <div>
              <div className="stat-value">{withRejections}</div>
              <div className="stat-label">Have Rejections</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card" style={{ marginBottom: 16 }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍  Search by student name or roll number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Student List */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : students.length === 0 ? (
          <div className="card empty-card"><p>No students found.</p></div>
        ) : (
          <div className="admin-list">
            {students.map(s => (
              <div key={s.uid} className="admin-student-card">
                <div
                  className="asc-summary"
                  onClick={() => setExpanded(expanded === s.uid ? null : s.uid)}
                >
                  <div className="asc-left">
                    <div className="sc-avatar" style={{ background: s.fullyApproved ? '#22c55e' : '#3b82f6' }}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <span className="sc-name">{s.name}</span>
                      <span className="sc-roll">{s.rollNumber} · Sem {s.semester}</span>
                    </div>
                  </div>

                  <div className="asc-pills">
                    <span className="badge badge-approved">✅ {s.approved}</span>
                    <span className="badge badge-pending">⏳ {s.pending}</span>
                    <span className="badge badge-rejected">❌ {s.rejected}</span>
                    {s.fullyApproved && <span className="badge-full">ELIGIBLE ✓</span>}
                  </div>

                  <div className="asc-progress">
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: s.totalSubjects ? `${(s.approved / s.totalSubjects) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="prog-text">{s.approved}/{s.totalSubjects}</span>
                  </div>

                  <span className="expand-icon">{expanded === s.uid ? '▲' : '▼'}</span>
                </div>

                {expanded === s.uid && (
                  <div className="asc-detail">
                    <table className="approval-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Faculty</th>
                          <th>Attendance</th>
                          <th>Status</th>
                          <th>Remark</th>
                          <th>Override</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.approvals.map(a => (
                          <tr key={a.approvalId}>
                            <td>{a.subjectName}</td>
                            <td>{a.facultyName}</td>
                            <td>
                              <span className={`attendance-pill ${a.attendancePercentage >= 75 ? 'ok' : 'low'}`}>
                                {a.attendancePercentage}%
                              </span>
                            </td>
                            <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                            <td style={{ fontSize: 12, color: 'var(--yellow)' }}>{a.remark || '—'}</td>
                            <td>
                              <button
                                className="btn btn-ghost override-btn"
                                onClick={() => setOverrideModal(a)}
                              >
                                Override
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Override Modal */}
      {overrideModal && (
        <div className="modal-overlay" onClick={() => setOverrideModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">⚙️ Admin Override</h3>
            <p className="modal-student">{overrideModal.studentName} — {overrideModal.subjectName}</p>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">New Status</label>
              <select
                className="form-input"
                value={overrideStatus}
                onChange={e => setOverrideStatus(e.target.value)}
              >
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending (Reset)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Remark</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Reason for override..."
                value={overrideRemark}
                onChange={e => setOverrideRemark(e.target.value)}
              />
            </div>

            {overrideMsg && (
              <div className={`alert ${overrideMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
                {overrideMsg}
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setOverrideModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleOverride} disabled={overrideLoading}>
                {overrideLoading ? 'Saving...' : 'Apply Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
