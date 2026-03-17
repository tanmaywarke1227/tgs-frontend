import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import './StudentDashboard.css';

const statusIcon = {
  approved: '✅',
  rejected: '❌',
  pending:  '⏳',
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/student/status');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load approval status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const summary = data?.summary;
  const approvals = data?.approvals || [];

  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">My Term Grant Slip</h1>
            <p className="page-sub">Welcome, {user?.name} · {user?.rollNumber} · Sem {user?.semester}</p>
          </div>
          <button className="btn btn-ghost" onClick={fetchStatus} disabled={loading}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">📋</div>
                <div>
                  <div className="stat-value">{summary?.total ?? 0}</div>
                  <div className="stat-label">Total Subjects</div>
                </div>
              </div>
              <div className="stat-card approved">
                <div className="stat-icon">✅</div>
                <div>
                  <div className="stat-value">{summary?.approved ?? 0}</div>
                  <div className="stat-label">Approved</div>
                </div>
              </div>
              <div className="stat-card pending">
                <div className="stat-icon">⏳</div>
                <div>
                  <div className="stat-value">{summary?.pending ?? 0}</div>
                  <div className="stat-label">Pending</div>
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

            {/* All Approved Banner */}
            {summary?.allApproved && (
              <div className="all-approved-banner">
                <span>🎉</span>
                <div>
                  <strong>All approvals complete!</strong>
                  <p>Your term grant slip is fully approved. You are eligible to appear in examinations.</p>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {summary?.total > 0 && (
              <div className="card progress-card">
                <div className="progress-header">
                  <span>Overall Progress</span>
                  <span>{summary.approved}/{summary.total} Approved</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${(summary.approved / summary.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Approvals Table */}
            <div className="card">
              <h2 className="section-title">Subject-wise Approval Status</h2>
              {approvals.length === 0 ? (
                <p className="empty-msg">No subjects found. Contact your administrator.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="approval-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Subject</th>
                        <th>Code</th>
                        <th>Faculty</th>
                        <th>Attendance</th>
                        <th>Status</th>
                        <th>Remark</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.map((a, i) => (
                        <tr key={a.approvalId} className={`row-${a.status}`}>
                          <td className="td-num">{i + 1}</td>
                          <td className="td-subject">{a.subjectName}</td>
                          <td className="td-code">{a.subjectCode}</td>
                          <td className="td-faculty">{a.facultyName}</td>
                          <td className="td-attendance">
                            <span className={`attendance-pill ${a.attendancePercentage >= 75 ? 'ok' : 'low'}`}>
                              {a.attendancePercentage}%
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${a.status}`}>
                              {statusIcon[a.status]} {a.status}
                            </span>
                          </td>
                          <td className="td-remark">
                            {a.remark || <span className="no-remark">—</span>}
                          </td>
                          <td className="td-date">
                            {a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
