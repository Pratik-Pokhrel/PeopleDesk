import { useEffect, useState } from 'react'
import { attendanceApi, employeesApi, leaveApi } from '../../api/peopleDeskApi.js'
import { formatDate, formatHours } from '../../utils/format.js'
import Icon from '../../components/Icon.jsx'

const monthNow = () => new Date().toISOString().slice(0, 7)
const yearNow = () => new Date().getUTCFullYear()

export default function DashboardPage({ user, token, onNavigate, pendingCount }) {
  const [summary, setSummary] = useState(null)
  const [balances, setBalances] = useState([])
  const [requests, setRequests] = useState([])
  const [peopleCount, setPeopleCount] = useState(null)
  const [errors, setErrors] = useState([])
  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER'

  useEffect(() => {
    let active = true

    const load = async () => {
      const tasks = [
        attendanceApi.summary(token, { month: monthNow() }),
        leaveApi.balances(token, yearNow()),
        leaveApi.mine(token),
      ]

      if (canManage) {
        tasks.push(employeesApi.list(token))
      }

      const results = await Promise.allSettled(tasks)
      if (!active) return

      const messages = []

      const getResult = (index, label) => {
        const result = results[index]
        if (result.status === 'fulfilled') return result.value
        messages.push(`${label}: ${result.reason.message}`)
        return null
      }

      setSummary(getResult(0, 'Attendance'))
      setBalances(getResult(1, 'Leave balances') ?? [])
      setRequests(getResult(2, 'Leave requests') ?? [])

      if (canManage) {
        setPeopleCount((getResult(3, 'People') ?? []).filter((person) => person.isActive).length)
      }
      setErrors(messages)
    }

    load()
    return () => { active = false }

  }, [canManage, token])

  const remaining = balances.reduce((sum, balance) => sum + (balance.remainingDays ?? 0), 0)
  const latestRequests = requests.slice(0, 4)

  const statCards = [
    {
      label: 'Hours this month',
      value: summary ? formatHours(summary.totalHours) : '--',
      note: summary ? `Across ${summary.daysPresent} days` : 'Your monthly total',
      icon: 'clock',
      tone: 'green',
    },
    {
      label: 'Leave days available',
      value: balances.length ? remaining : '0',
      note: `Across ${balances.length} leave types`,
      icon: 'calendar',
      tone: 'blue',
    },
    ...(canManage ? [
      {
        label: 'Pending approvals',
        value: pendingCount ?? '--',
        note: 'Requests waiting for you',
        icon: 'check',
        tone: 'amber',
      },
      {
        label: 'Active people',
        value: peopleCount ?? '--',
        note: user.role === 'ADMIN' ? 'In your workspace' : 'In the organization',
        icon: 'users',
        tone: 'purple',
      },
    ] : []),
  ]

  return (
    <div className="dashboard-layout">

      {errors.map((message) => <p className="alert alert-error" role="alert" key={message}>{message}</p>)}

      <section className={`welcome-banner${canManage ? ' welcome-wide' : ''}`}>

        <div className="welcome-copy">
          <span className="welcome-tag"><span className="welcome-dot" /> YOUR PEOPLE OPERATIONS HUB</span>
          <h2>Make space for your people.</h2>
          <p>Your day, your team, and everything in between - all in one place.</p>
          <button className="button button-light" type="button" onClick={() => onNavigate('attendance')}>
            Go to attendance <Icon name="arrow" size={16} />
          </button>
        </div>

        <div className="welcome-art" aria-hidden="true">
          <span className="art-orbit orbit-one" />
          <span className="art-orbit orbit-two" />
          <span className="art-sun" />
          <span className="art-leaf leaf-one" />
          <span className="art-leaf leaf-two" />
          <span className="art-ground" />
        </div>

      </section>

      <div className="stats-grid">
        {statCards.map((card) => (
          <article className="stat-card" key={card.label}>
            <div className={`stat-icon tone-${card.tone}`}><Icon name={card.icon} /></div>
            <p className="stat-label">{card.label}</p>
            <strong className="stat-value">{card.value}</strong>
            <span className="stat-note">{card.note}</span>
          </article>
        ))}
      </div>

      <div className="dashboard-columns">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div><h2>Recent time off</h2><p>Your latest leave requests</p></div>
            <button className="text-button" type="button" onClick={() => onNavigate('leave')}>View all <Icon name="arrow" size={15} /></button>
          </div>
          {latestRequests.length === 0 ? (
            <div className="empty-inline"><span className="empty-symbol"><Icon name="calendar" /></span><p>No leave requests yet</p><small>When you request time off, it will appear here.</small></div>
          ) : (
            <div className="request-list">
              {latestRequests.map((request) => (
                <div className="request-list-item" key={request.id}>
                  <span className="request-date-icon"><Icon name="calendar" size={17} /></span>
                  <span className="request-list-main">
                    <strong>{request.leaveType?.name ?? 'Leave request'}</strong>
                    <small>{formatDate(request.startDate)} - {formatDate(request.endDate)} · {request.days} days</small>
                  </span>
                  <span className={`status-pill status-${request.status?.toLowerCase()}`}>{request.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel quick-panel">

          <div className="panel-heading"><div><h2>Quick actions</h2><p>Get where you need to go</p></div></div>

          <button className="quick-link" type="button" onClick={() => onNavigate('attendance')}>
            <span className="quick-icon quick-green"><Icon name="clock" /></span><span><strong>Log attendance</strong><small>Start or end your workday</small></span><Icon name="chevron" size={17} />
          </button>

          <button className="quick-link" type="button" onClick={() => onNavigate('leave')}>
            <span className="quick-icon quick-blue"><Icon name="calendar" /></span><span><strong>Request time off</strong><small>Check balances and apply</small></span><Icon name="chevron" size={17} />
          </button>

          {canManage && (
            <button className="quick-link" type="button" onClick={() => onNavigate('approvals')}>
              <span className="quick-icon quick-orange"><Icon name="check" /></span><span><strong>Review requests</strong><small>Keep your team moving</small></span><Icon name="chevron" size={17} />
            </button>

          )}
        </section>
      </div>
    </div>
  )
}
