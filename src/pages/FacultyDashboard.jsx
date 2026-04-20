import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import './FacultyDashboard.css';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
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
      const [res, subRes] = await Promise.all([
        api.get('/api/faculty/pending'),
        api.get('/api/faculty/submissions')
      ]);
      setData(res.data);
      setSubmissions(subRes.data.submissions || []);
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

  const handleSubChange = async (submissionId, field, value) => {
    // Optimistic update
    setSubmissions(prev => 
      prev.map(s => s.submissionId === submissionId ? { ...s, [field]: value } : s)
    );
    try {
      await api.put('/api/faculty/update-submission', {
        submissionId,
        [field]: value
      });
    } catch (err) {
      // Revert on error
      fetchData();
      alert(`Update failed: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const handleVerify = async (submissionId) => {
    if (!window.confirm("Are you sure you want to verify this student? This action cannot be undone and locks the row.")) return;
    
    try {
      await api.post('/api/faculty/verify-submission', { submissionId });
      alert("Submission verified successfully!");
      fetchData(); // Refresh to lock row
    } catch (err) {
      alert(`Verification failed: ${err.response?.data?.error || 'All TAS and Assignments must be completed'}`);
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
          {['pending','approved','rejected','all', 'submissions'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'submissions' ? 'Submission Tracking' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== 'submissions' && <span className="tab-count">{lists[tab].length}</span>}
            </button>
          ))}
        </div>

        {/* Rendering depending on active tab */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : activeTab === 'submissions' ? (
          <div className="card">
            {submissions.length === 0 ? (
              <p className="empty-card">No submissions tracking data found.</p>
            ) : (
              <div className="table-wrapper">
                <table className="approval-table faculty-submission-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Subject</th>
                      <th>TA 1</th>
                      <th>TA 2</th>
                      <th>Repeat TA</th>
                      <th>Assign 1</th>
                      <th>Assign 2</th>
                      <th>Assign 3</th>
                      <th>Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(s => (
                      <tr key={s.submissionId} className={s.is_verified ? "row-verified" : ""}>
                        <td className="td-name">
                          <strong>{s.studentName}</strong>
                        </td>
                        <td className="td-subject">{s.subjectName}</td>
                        {["ta1", "ta2", "repeat_ta", "assignment1", "assignment2", "assignment3"].map(field => (
                          <td key={field} className="center-col">
                            <input 
                              type="checkbox" 
                              className="custom-checkbox"
                              checked={s[field]} 
                              disabled={s.is_verified}
                              onChange={(e) => handleSubChange(s.submissionId, field, e.target.checked)} 
                            />
                          </td>
                        ))}
                        <td>
                          {s.is_verified ? (
                            <span className="badge badge-approved">Verified ✅</span>
                          ) : (
                            <button 
                              className="btn btn-sm btn-success" 
                              onClick={() => handleVerify(s.submissionId)}
                              disabled={!(s.ta1 && s.ta2 && s.assignment1 && s.assignment2 && s.assignment3)}
                              title={!(s.ta1 && s.ta2 && s.assignment1 && s.assignment2 && s.assignment3) ? "Complete all requirements first" : "Mark as verified"}
                            >
                              Verify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
