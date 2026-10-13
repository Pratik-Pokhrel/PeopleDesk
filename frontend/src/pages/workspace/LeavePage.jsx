import { useCallback, useEffect, useState } from 'react'
import { leaveApi } from '../../api/peopleDeskApi.js'
import { formatDate } from '../../utils/format.js'
import Icon from '../../components/Icon.jsx'

const thisYear = () => new Date().getUTCFullYear()
const today = () => new Date().toISOString().slice(0, 10)

export default function LeavePage({ token }) {
  const [balanceYear, setBalanceYear] = useState(thisYear())
  const [types, setTypes] = useState([])
  const [balances, setBalances] = useState([])
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [cancelId, setCancelId] = useState(null)

  const load = useCallback(async () => {

    try {
      const [nextTypes, nextBalances, nextRequests] = await Promise.all([
        leaveApi.types(token),
        leaveApi.balances(token, balanceYear),
        leaveApi.mine(token),
      ])

      setTypes(nextTypes)
      setBalances(nextBalances)
      setRequests(nextRequests)

    } catch (requestError) {
      setError(requestError.message)
    }
  }, [balanceYear, token])

  useEffect(() => {
    let active = true
    const fetchLeaveData = async () => {

      try {
        const [nextTypes, nextBalances, nextRequests] = await Promise.all([
          leaveApi.types(token),
          leaveApi.balances(token, balanceYear),
          leaveApi.mine(token),
        ])

        if (!active) return
        setTypes(nextTypes)
        setBalances(nextBalances)
        setRequests(nextRequests)
        setError('')

      } catch (requestError) {
        if (active) setError(requestError.message)
      }
    }

    fetchLeaveData()
    return () => { active = false }
  }, [balanceYear, token])

  async function submitRequest(event) {

    event.preventDefault()
    const form = event.currentTarget
    setError('')
    setNotice('')
    setBusy(true)

    const formData = new FormData(event.currentTarget)
    const reason = formData.get('reason').trim()

    try {
      const request = {
        leaveTypeId: formData.get('leaveTypeId'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        ...(reason ? { reason } : {}),
      }

      const created = await leaveApi.createRequest(token, request)
      setNotice(`Your request for ${created.days} working day${created.days === 1 ? '' : 's'} has been submitted.`)
      form.reset()
      await load()

    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function cancelRequest(id) {
    setError('')
    setNotice('')
    setCancelId(id)

    try {
      await leaveApi.cancel(token, id)
      setNotice('Your leave request has been withdrawn.')
      await load()

    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setCancelId(null)
    }
  }

  return (
    <div className="content-stack">
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {notice && <p className="alert alert-success" role="status">{notice}</p>}

      <div className="section-intro">
        <div><h2>Your leave balance</h2><p>Available days by leave type</p></div>
        <label className="year-select"><Icon name="calendar" size={15} /><span className="sr-only">Balance year</span><select value={balanceYear} onChange={(event) => setBalanceYear(Number(event.target.value))}>{Array.from({ length: 5 }, (_, index) => thisYear() - index).map((year) => <option value={year} key={year}>{year}</option>)}</select></label>
      </div>

      <div className="balance-grid">
        {balances.length === 0 ? (
          <div className="panel balance-empty"><span className="empty-symbol"><Icon name="calendar" /></span><strong>No leave balances found</strong><small>Ask your administrator to set up your leave balance.</small></div>
        ) : balances.map((balance) => {
          const total = balance.totalDays ?? 0
          const used = balance.usedDays ?? 0
          const remaining = balance.remainingDays ?? total - used
          const percentUsed = total > 0 ? Math.min(100, (used / total) * 100) : 0
          return (
            <article className="panel balance-card" key={balance.id}>
              <div className="balance-card-top">
                <span className="balance-icon"><Icon name="calendar" /></span>
                <span className="balance-year">{balanceYear}</span>
              </div>
              <h3>{balance.leaveType?.name ?? 'Leave'}</h3>
              <div className="balance-number"><strong>{remaining}</strong><span>days left</span></div>
              <div className="balance-progress"><span style={{ width: `${percentUsed}%` }} /></div>
              <div className="balance-caption"><span>{used} used</span><span>{total} days total</span></div>
            </article>
          )
        })}
      </div>

      <div className="leave-columns">
        <section className="panel form-panel" id="leave-request-form">
          <div className="panel-heading"><div><h2>Request time off</h2><p>Choose the dates and leave type</p></div><span className="form-heading-icon"><Icon name="plus" /></span></div>
          {types.length === 0 ? (
            <p className="alert alert-warning">Leave types are currently unavailable.</p>
          ) : (
            <form className="form-stack" onSubmit={submitRequest}>
              <label className="field-label">Leave type
                <select name="leaveTypeId" required defaultValue="">
                  <option value="" disabled>Select a leave type</option>
                  {types.map((type) => <option key={type.id} value={type.id}>{type.name} - {type.defaultDays} days / year</option>)}
                </select>
              </label>
              <div className="field-row">
                <label className="field-label">Start date<input name="startDate" type="date" min={today()} required /></label>
                <label className="field-label">End date<input name="endDate" type="date" min={today()} required /></label>
              </div>
              <label className="field-label">Reason <span className="optional-label">Optional</span>
                <textarea name="reason" rows="3" maxLength="500" placeholder="Add a note for your manager..." />
              </label>
              <p className="form-hint">Weekends are excluded from the working-day total. A request must stay within one calendar year.</p>
              <button className="button button-primary button-full" type="submit" disabled={busy || types.length === 0}>
                <Icon name="arrow" size={16} /> {busy ? 'Submitting...' : 'Submit request'}
              </button>
            </form>
          )}
        </section>

        <section className="panel request-history-panel">
          <div className="panel-heading"><div><h2>My requests</h2><p>Track the status of your time off</p></div></div>
          {requests.length === 0 ? (
            <div className="empty-inline"><span className="empty-symbol"><Icon name="calendar" /></span><p>No requests yet</p><small>Your submitted requests will show here.</small></div>
          ) : (
            <div className="my-request-list">
              {requests.map((request) => (
                <article className="my-request" key={request.id}>
                  <div className="my-request-title">
                    <span className="request-date-icon"><Icon name="calendar" size={17} /></span>
                    <span><strong>{request.leaveType?.name ?? 'Leave request'}</strong><small>{request.days} working day{request.days === 1 ? '' : 's'}</small></span>
                    <span className={`status-pill status-${request.status.toLowerCase()}`}>{request.status}</span>
                  </div>
                  <p className="my-request-dates">{formatDate(request.startDate)} - {formatDate(request.endDate)}</p>
                  {request.reason && <p className="my-request-reason">{request.reason}</p>}
                  {request.status === 'PENDING' && (
                    <button className="text-button text-danger" type="button" disabled={cancelId === request.id} onClick={() => cancelRequest(request.id)}>
                      {cancelId === request.id ? 'Withdrawing...' : 'Withdraw request'}
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
