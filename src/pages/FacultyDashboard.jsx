import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import './FacultyDashboard.css';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [modal, setModal] = useState(null); // { approvalId, studentName, action }
  const [remark, setRemark] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/faculty/pending');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (approval, action) => {
    setModal({ ...approval, action });
    setRemark('');
    setActionMsg('');
  };

  const closeModal = () => {
    setModal(null);
    setRemark('');
    setActionMsg('');
  };

  const handleAction = async () => {
    setActionLoading(true);
    setActionMsg('');
    try {
      const endpoint = modal.action === 'approve' ? '/api/faculty/approve' : '/api/faculty/reject';
      await api.post(endpoint, {
        approvalId: modal.approvalId,
        remark: remark || (modal.action === 'reject' ? 'Attendance below required threshold.' : ''),
      });
      setActionMsg(`✅ Student ${modal.action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      setTimeout(() => {
        closeModal();
        fetchData();
      }, 1200);
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.error || 'Action failed.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const lists = {
    pending:  data?.pending  || [],
    approved: data?.approved || [],
    rejected: data?.rejected || [],
    all:      data?.all      || [],
  };

  const summary = data?.summary;
  const currentList = lists[activeTab];

  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main">

        <div className="page-header">
          <div>
            <h1 className="page-title">Faculty Approval Panel</h1>
            <p className="page-sub">Welcome, {user?.name} · {user?.department}</p>
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
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div>
              <div className="stat-value">{summary?.total ?? 0}</div>
              <div className="stat-label">Total Students</div>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div>
              <div className="stat-value">{summary?.pending ?? 0}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card approved">
            <div className="stat-icon">✅</div>
            <div>
              <div className="stat-value">{summary?.approved ?? 0}</div>
              <div className="stat-label">Approved</div>
            </div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-icon">❌</div>
            <div>
              <div className="stat-value">{summary?.rejected ?? 0}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {['pending','approved','rejected','all'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="tab-count">{lists[tab].length}</span>
            </button>
          ))}
        </div>

        {/* Student Cards */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : currentList.length === 0 ? (
          <div className="card empty-card">
            <p>No students in this category.</p>
          </div>
        ) : (
          <div className="student-grid">
            {currentList.map(a => (
              <div key={a.approvalId} className={`student-card status-${a.status}`}>
                <div className="sc-header">
                  <div className="sc-avatar">{a.studentName.charAt(0)}</div>
                  <div className="sc-info">
                    <span className="sc-name">{a.studentName}</span>
                    <span className="sc-roll">{a.studentRoll}</span>
                  </div>
                  <span className={`badge badge-${a.status}`}>{a.status}</span>
                </div>

                <div className="sc-body">
                  <div className="sc-meta">
                    <span>📘 {a.subjectName}</span>
                    <span className={`attendance-pill ${a.attendancePercentage >= 75 ? 'ok' : 'low'}`}>
                      {a.attendancePercentage}% attendance
                    </span>
                  </div>

                  {a.remark && (
                    <div className="sc-remark">
                      <span>💬 {a.remark}</span>
                    </div>
                  )}
                </div>

                {a.status === 'pending' && (
                  <div className="sc-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => openModal(a, 'approve')}
                    >✅ Approve</button>
                    <button
                      className="btn btn-danger"
                      onClick={() => openModal(a, 'reject')}
                    >❌ Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Action Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">
              {modal.action === 'approve' ? '✅ Approve Student' : '❌ Reject Student'}
            </h3>
            <p className="modal-student">
              <strong>{modal.studentName}</strong> ({modal.studentRoll})
            </p>
            <p className="modal-subject">Subject: {modal.subjectName}</p>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">
                {modal.action === 'approve' ? 'Remark (optional)' : 'Reason for rejection (required)'}
              </label>
              <textarea
                className="form-input form-textarea"
                placeholder={
                  modal.action === 'approve'
                    ? 'Leave blank to approve without remark...'
                    : 'e.g. Attendance below 75%. Please apply for condonation.'
                }
                value={remark}
                onChange={e => setRemark(e.target.value)}
              />
            </div>

            {actionMsg && (
              <div className={`alert ${actionMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
                {actionMsg}
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button
                className={`btn ${modal.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : modal.action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
