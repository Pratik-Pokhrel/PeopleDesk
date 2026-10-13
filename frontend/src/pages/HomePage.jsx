import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { leaveApi } from '../api/peopleDeskApi.js'
import logo from '../assets/logo.png'
import Icon from '../components/Icon.jsx'
import { initials, fullName } from '../utils/format.js'
import AttendancePage from './workspace/AttendancePage.jsx'
import LeavePage from './workspace/LeavePage.jsx'
import ApprovalsPage from './workspace/ApprovalsPage.jsx'
import EmployeesPage from './workspace/EmployeesPage.jsx'
import DashboardPage from './workspace/DashboardPage.jsx'

const navigation = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'attendance', label: 'Attendance', icon: 'clock' },
  { id: 'leave', label: 'Leave & time off', icon: 'calendar' },
  { id: 'approvals', label: 'Approvals', icon: 'check', roles: ['ADMIN', 'MANAGER'] },
  { id: 'team', label: 'People', icon: 'users', roles: ['ADMIN', 'MANAGER'] },
]

const pageTitles = {
  overview: ['Overview', 'Here is what is happening in your workspace.'],
  attendance: ['Attendance', 'Keep track of your work sessions.'],
  leave: ['Leave & time off', 'Manage your balances and requests.'],
  approvals: ['Leave approvals', 'Review time-off requests from your team.'],
  team: ['People', 'Your people directory and team overview.'],
}

export default function HomePage() {
  const { user, token, logout } = useAuth()
  const [activePage, setActivePage] = useState('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [desktopNavCollapsed, setDesktopNavCollapsed] = useState(false)
  const [pendingCount, setPendingCount] = useState(null)
  const [approvalsError, setApprovalsError] = useState('')
  const pendingCountRevision = useRef(0)

  const navItems = navigation.filter((item) => !item.roles || item.roles.includes(user.role))
  const [eyebrow, subtitle] = pageTitles[activePage]
  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER'

  const updatePendingCount = useCallback((count) => {
    pendingCountRevision.current += 1
    setPendingCount(count)
    setApprovalsError('')
  }, [])

  useEffect(() => {
    if (!canManage) return undefined
    let active = true
    // Don't let this initial fetch overwrite a newer count from the approvals page.
    const revision = pendingCountRevision.current
    leaveApi.pending(token)
      .then((requests) => {
        if (active && revision === pendingCountRevision.current) {
          setPendingCount(requests.length)
          setApprovalsError('')
        }
      })
      .catch((requestError) => {
        if (active && revision === pendingCountRevision.current) setApprovalsError(requestError.message)
      })
    return () => { active = false }
  }, [canManage, token])

  function navigate(page) {
    setActivePage(page)
    setMobileNavOpen(false)
  }

  function toggleNavigation() {
    if (window.matchMedia('(max-width: 900px)').matches) {
      setMobileNavOpen((open) => !open)
      return
    }
    setDesktopNavCollapsed((collapsed) => !collapsed)
  }

  return (
    <div className="workspace">
      {mobileNavOpen && (
        <button
          className="mobile-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside className={`sidebar${mobileNavOpen ? ' sidebar-open' : ''}${desktopNavCollapsed ? ' sidebar-collapsed' : ''}`}>
        <div className="sidebar-toggle-row">
          <button
            className="icon-button sidebar-toggle"
            type="button"
            aria-label={mobileNavOpen ? 'Close navigation' : desktopNavCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded={window.matchMedia('(max-width: 900px)').matches ? mobileNavOpen : !desktopNavCollapsed}
            onClick={toggleNavigation}
          >
            <Icon name={mobileNavOpen || !desktopNavCollapsed ? 'close' : 'menu'} />
          </button>
        </div>

        <div className="sidebar-brand">
          <img className="brand-logo" src={logo} alt="PeopleDesk" />
          <span className="brand-name">people<span className="brand-light">desk</span></span>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              className={`nav-item${activePage === item.id ? ' nav-item-active' : ''}`}
              key={item.id}
              type="button"
              title={desktopNavCollapsed ? item.label : undefined}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === 'approvals' && pendingCount !== null && (
                <span
                  className={`nav-dot ${pendingCount > 0 ? 'nav-dot-pending' : 'nav-dot-clear'}`}
                  aria-label={pendingCount > 0 ? `${pendingCount} pending approvals` : 'No pending approvals'}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <span className="profile-copy"><strong>{fullName(user)}</strong><small>{user.role.toLowerCase()}</small></span>
            <button className="icon-button logout-button" type="button" title="Sign out" aria-label="Sign out" onClick={logout}>
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="topbar">
          {!mobileNavOpen && (
            <button
              className="icon-button mobile-menu"
              type="button"
              aria-label="Open navigation"
              aria-expanded="false"
              onClick={() => setMobileNavOpen(true)}
            >
              <Icon name="menu" />
            </button>
          )}
          <div className="breadcrumbs"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{pageTitles[activePage][0]}</strong></div>
          <div className="topbar-right">
            <span className="today-label">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date())}</span>
            <span className="avatar">{initials(user)}</span>
          </div>
        </header>

        <section className="page-content">
          {approvalsError && <p className="alert alert-error" role="alert">Approvals: {approvalsError}</p>}
          <div className="page-heading">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1>{activePage === 'overview' ? `Good to see you, ${user.firstName || 'there'}` : eyebrow}</h1>
              <p className="page-subtitle">{subtitle}</p>
            </div>
            {activePage === 'leave' && (
              <button className="button button-primary" type="button" onClick={() => document.getElementById('leave-request-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                <Icon name="plus" size={17} /> New request
              </button>
            )}
          </div>

          {activePage === 'overview' && <DashboardPage user={user} token={token} onNavigate={navigate} pendingCount={pendingCount} />}
          {activePage === 'attendance' && <AttendancePage token={token} />}
          {activePage === 'leave' && <LeavePage token={token} />}
          {activePage === 'approvals' && <ApprovalsPage token={token} onPendingCountChange={updatePendingCount} />}
          {activePage === 'team' && <EmployeesPage token={token} user={user} />}
        </section>
      </main>
    </div>
  )
}
