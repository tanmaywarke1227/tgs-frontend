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
  const [submissions, setSubmissions] = useState([]);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [docModal, setDocModal] = useState(null); // 'certificate' or 'hallticket'

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [res, subRes, eligRes] = await Promise.all([
        api.get('/api/student/status'),
        api.get('/api/student/submissions'),
        api.get('/api/student/check-eligibility')
      ]);
      setData(res.data);
      setSubmissions(subRes.data.submissions || []);
      setEligible(eligRes.data.eligible || false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data.');
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
          <div className="header-actions">
            {!eligible && <div className="eligibility-notice">Complete submissions to unlock</div>}
            <button 
              className="btn btn-success" 
              disabled={!eligible} 
              onClick={() => setDocModal('certificate')}
              title={!eligible ? "Complete all submissions and verification to unlock" : "Generate Certificate"}
            >
              🏅 Generate Certificate
            </button>
            <button 
              className="btn btn-primary" 
              disabled={!eligible} 
              onClick={() => setDocModal('hallticket')}
              title={!eligible ? "Complete all submissions and verification to unlock" : "Download Hall Ticket"}
            >
              🎫 Download Hall Ticket
            </button>
            <button className="btn btn-ghost" onClick={fetchStatus} disabled={loading}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh
            </button>
          </div>
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

            {/* Submissions Table */}
            <div className="card mt-4">
              <h2 className="section-title">Submission Status & Verification</h2>
              {submissions.length === 0 ? (
                <p className="empty-msg">No submissions tracking data found.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="approval-table submission-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th className="center-col">TA 1</th>
                        <th className="center-col">TA 2</th>
                        <th className="center-col">Repeat TA</th>
                        <th className="center-col">Assign 1</th>
                        <th className="center-col">Assign 2</th>
                        <th className="center-col">Assign 3</th>
                        <th>Verif. Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(s => (
                        <tr key={s.submissionId}>
                          <td className="td-subject">{s.subjectName}</td>
                          <td className="center-col">{s.ta1 ? <span className="status-ok">✔</span> : <span className="status-err">✘</span>}</td>
                          <td className="center-col">{s.ta2 ? <span className="status-ok">✔</span> : <span className="status-err">✘</span>}</td>
                          <td className="center-col">{s.repeat_ta ? <span className="status-ok">✔</span> : <span className="status-na">—</span>}</td>
                          <td className="center-col">{s.assignment1 ? <span className="status-ok">✔</span> : <span className="status-err">✘</span>}</td>
                          <td className="center-col">{s.assignment2 ? <span className="status-ok">✔</span> : <span className="status-err">✘</span>}</td>
                          <td className="center-col">{s.assignment3 ? <span className="status-ok">✔</span> : <span className="status-err">✘</span>}</td>
                          <td>
                            <span className={`badge badge-${s.is_verified ? 'approved' : 'pending'}`}>
                              {s.is_verified ? 'Verified ✅' : 'Not Verified ⏳'}
                            </span>
                            {s.verified_by && <div className="verified-by"><small>by {s.verified_by}</small></div>}
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

      {/* Document Modal */}
      {docModal && (
        <div className="modal-overlay" onClick={() => setDocModal(null)}>
          <div className="modal-box doc-modal" onClick={e => e.stopPropagation()}>
            <div className="doc-header">
              <h3>{docModal === 'certificate' ? 'Term Grant Certificate' : 'Examination Hall Ticket'}</h3>
              <button className="btn btn-ghost" onClick={() => setDocModal(null)}>✕</button>
            </div>
            
            <div className="doc-content">
              <div className="doc-brand">
                <h2>{docModal === 'certificate' ? 'CERTIFICATE OF COMPLETION' : 'HALL TICKET'}</h2>
                <p>Term 2026</p>
              </div>
              
              <div className="doc-body">
                <p>This is to certify that <strong>{user?.name}</strong> (Roll: {user?.rollNumber})</p>
                <p>has successfully completed all term grant submissions and verifications.</p>
                {docModal === 'certificate' && <p>They are granted the term successfully.</p>}
                {docModal === 'hallticket' && <p>They are completely eligible to sit in the examination.</p>}
              </div>

              <div className="doc-footer">
                <div>
                  <p>____________________</p>
                  <small>Controller of Examinations</small>
                </div>
                <div>
                  <p>____________________</p>
                  <small>HOD</small>
                </div>
              </div>
            </div>

            <div className="doc-actions">
              <button className="btn btn-primary" onClick={() => {
                window.print();
              }}>🖨 Print Document</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
