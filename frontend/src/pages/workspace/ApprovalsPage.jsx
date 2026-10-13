import { useCallback, useEffect, useState } from 'react'
import { leaveApi } from '../../api/peopleDeskApi.js'
import { formatDate, fullName, initials } from '../../utils/format.js'
import Icon from '../../components/Icon.jsx'

export default function ApprovalsPage({ token, onPendingCountChange }) {
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    try {
      const nextRequests = await leaveApi.pending(token)
      setRequests(nextRequests)
      setError('')
      onPendingCountChange(nextRequests.length)
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [onPendingCountChange, token])

  useEffect(() => {
    let active = true
    leaveApi.pending(token)
      .then((nextRequests) => {
        if (active) {
          setRequests(nextRequests)
          setError('')
          onPendingCountChange(nextRequests.length)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
    return () => { active = false }
  }, [onPendingCountChange, token])

  async function review(id, action) {
    setError('')
    setBusyId(id)

    try {
      await leaveApi[action](token, id)
      await load()
    } catch (requestError) {
      setError(requestError.message)
      // The server may have finished the review even if the response failed.
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="content-stack">
      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <section className="panel">
        <div className="panel-heading table-heading">
          <div><h2>Requests waiting for review</h2><p>Only requests from employees in your review scope are shown.</p></div>
          <span className="pending-count">{requests.length} pending</span>
        </div>

        {requests.length === 0 ? (
          <div className="table-empty approval-empty"><span className="empty-symbol"><Icon name="check" /></span><strong>All caught up</strong><small>There are no leave requests waiting for your review.</small></div>
        ) : (
          <div className="table-scroll">
            <table className="approvals-table">
              <thead><tr><th>Team member</th><th>Leave type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Review</th></tr></thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <span className="employee-cell">
                        <span className="avatar avatar-small">{initials(request.employee)}</span>
                        <span><strong className="table-primary">{fullName(request.employee)}</strong><small>{request.employee.department || 'No department'}</small></span>
                      </span>
                    </td>

                    <td>{request.leaveType?.name ?? 'Leave'}</td>
                    <td>{formatDate(request.startDate)}<small className="date-to">to {formatDate(request.endDate)}</small></td>
                    <td><strong>{request.days}</strong></td>
                    <td className="reason-cell">{request.reason || <span className="muted">No reason provided</span>}</td>
                    <td>
                      <div className="review-actions">
                        <button className="button button-approve" type="button" disabled={busyId === request.id} onClick={() => review(request.id, 'approve')}>
                          {busyId === request.id ? '...' : 'Approve'}
                        </button>
                        <button className="button button-reject" type="button" disabled={busyId === request.id} onClick={() => review(request.id, 'reject')}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
