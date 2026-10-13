import { useCallback, useEffect, useState } from 'react'
import { attendanceApi } from '../../api/peopleDeskApi.js'
import { formatDate, formatHours, formatTime } from '../../utils/format.js'
import Icon from '../../components/Icon.jsx'

const currentMonth = () => new Date().toISOString().slice(0, 7)

export default function AttendancePage({ token }) {
  const [month, setMonth] = useState(currentMonth)
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [checkedIn, setCheckedIn] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const maxDailyHours = summary?.days?.reduce((max, day) => Math.max(max, day.hours), 1) ?? 1

  const load = useCallback(async () => {

    try {
      const results = await Promise.all([
        attendanceApi.mine(token, month),
        attendanceApi.summary(token, { month }),
        ...(month === currentMonth() ? [] : [attendanceApi.summary(token, { month: currentMonth() })]),
      ])

      setRecords(results[0])
      setSummary(results[1])
      const todaySummary = month === currentMonth() ? results[1] : results[2]
      setCheckedIn(todaySummary.openSessions > 0)

    } catch (requestError) {
      setError(requestError.message)
    }
  }, [month, token])

  useEffect(() => {
    let active = true
    const fetchAttendance = async () => {
      try {
        const results = await Promise.all([
          attendanceApi.mine(token, month),
          attendanceApi.summary(token, { month }),
          ...(month === currentMonth() ? [] : [attendanceApi.summary(token, { month: currentMonth() })]),
        ])
        if (!active) return
        setRecords(results[0])
        setSummary(results[1])
        const todaySummary = month === currentMonth() ? results[1] : results[2]
        setCheckedIn(todaySummary.openSessions > 0)
        setError('')
      } catch (requestError) {
        if (active) setError(requestError.message)
      }
    }
    fetchAttendance()
    return () => { active = false }
  }, [month, token])

  async function toggleAttendance() {

    setBusy(true)
    setError('')

    try {
      if (checkedIn) await attendanceApi.checkOut(token)
      else await attendanceApi.checkIn(token)
      await load()

    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="content-stack">
      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <section className="attendance-hero panel">
        <div className="attendance-status-copy">
          <span className={`live-indicator${checkedIn ? ' live' : ''}`} />
          <span className="eyebrow">{checkedIn ? 'SESSION IN PROGRESS' : 'READY WHEN YOU ARE'}</span>
          <h2>{checkedIn ? 'You are checked in' : 'You are checked out'}</h2>
          <p>{checkedIn ? 'Remember to check out when you finish for the day.' : 'Check in to start tracking your work session.'}</p>
          <button className={`button ${checkedIn ? 'button-outline' : 'button-primary'} attendance-toggle`} type="button" onClick={toggleAttendance} disabled={busy}>
            <Icon name="clock" size={17} />{busy ? 'Saving...' : checkedIn ? 'Check out' : 'Check in'}
          </button>
        </div>
        <div className="attendance-today-card">
          <span className="today-icon"><Icon name="calendar" size={19} /></span>
          <span><small>TODAY</small><strong>{new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date())}</strong><em>{new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date())}</em></span>
        </div>
      </section>

      <div className="stats-grid attendance-stats">
        <article className="stat-card">
          <div className="stat-icon tone-green"><Icon name="clock" /></div>
          <p className="stat-label">Hours this month</p>
          <strong className="stat-value">{summary ? formatHours(summary.totalHours) : '--'}</strong>
          <span className="stat-note">Total recorded working time</span>
        </article>
        <article className="stat-card">
          <div className="stat-icon tone-blue"><Icon name="calendar" /></div>
          <p className="stat-label">Days present</p>
          <strong className="stat-value">{summary?.daysPresent ?? '--'}</strong>
          <span className="stat-note">Days with a recorded session</span>
        </article>
        <article className="stat-card">
          <div className="stat-icon tone-amber"><Icon name="check" /></div>
          <p className="stat-label">Open sessions</p>
          <strong className="stat-value">{summary?.openSessions ?? '--'}</strong>
          <span className="stat-note">Sessions to check out</span>
        </article>
      </div>

      <section className="panel hours-chart-panel">
        <div className="panel-heading">
          <div><h2>Daily hours</h2><p>Recorded hours by day in {month}</p></div>
        </div>
        {!summary?.days?.length ? (
          <div className="chart-empty">Your daily totals will appear here as you log attendance.</div>
        ) : (
          <div className="hours-chart-scroll">
            <div className="hours-chart">
              {summary.days.map((day) => {
                const barHeight = Math.max(5, (day.hours / maxDailyHours) * 100)
                return (
                  <div className="chart-day" key={day.date} title={`${day.date}: ${formatHours(day.hours)}`}>
                    <span className="chart-hours">{day.hours ? day.hours.toFixed(1) : '0'}h</span>
                    <span className="chart-bar-track"><span className="chart-bar" style={{ height: `${barHeight}%` }} /></span>
                    <span className="chart-date">{new Date(`${day.date}T00:00:00Z`).getUTCDate()}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading table-heading">
          <div><h2>Attendance history</h2><p>Your check-in sessions, grouped by month</p></div>
          <label className="month-select"><span className="sr-only">Choose month</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Work date</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="5"><div className="table-empty"><span className="empty-symbol"><Icon name="clock" /></span><strong>No attendance records</strong><small>There are no sessions recorded for this month.</small></div></td></tr>
              ) : records.map((record) => (
                <tr key={record.id}>
                  <td className="table-primary">{formatDate(record.checkIn)}</td>
                  <td>{formatTime(record.checkIn)}</td>
                  <td>{record.checkOut ? formatTime(record.checkOut) : <span className="muted">In progress</span>}</td>
                  <td>{formatHours(record.hours)}</td>
                  <td><span className={`status-pill ${record.checkOut ? 'status-approved' : 'status-pending'}`}>{record.checkOut ? 'Complete' : 'Open'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
