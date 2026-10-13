import { useCallback, useEffect, useMemo, useState } from 'react'
import { attendanceApi, employeesApi } from '../../api/peopleDeskApi.js'
import { fullName, initials, formatHours } from '../../utils/format.js'
import Icon from '../../components/Icon.jsx'

const roles = ['ADMIN', 'MANAGER', 'EMPLOYEE']
const thisMonth = () => new Date().toISOString().slice(0, 7)

const blankEmployee = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  department: '',
  managerId: '',
}

export default function EmployeesPage({ token, user }) {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newEmployee, setNewEmployee] = useState(blankEmployee)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [busy, setBusy] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(thisMonth)
  const [teamSummary, setTeamSummary] = useState(null)
  const [summaryError, setSummaryError] = useState('')
  const isAdmin = user.role === 'ADMIN'

  const load = useCallback(async () => {
    try {
      setEmployees(await employeesApi.list(token))
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [token])

  useEffect(() => {

    let active = true
    employeesApi.list(token)
      .then((nextEmployees) => {
        if (active) {
          setEmployees(nextEmployees)
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
    return () => { active = false }
  }, [token])

  const managerById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, fullName(employee)])),
    [employees],
  )

  const activeManagers = useMemo(
    () => employees.filter((employee) => employee.isActive && ['ADMIN', 'MANAGER'].includes(employee.role)),
    [employees],
  )

  const attendancePeople = useMemo(
    () => employees.filter((employee) =>
      employee.id !== user.id &&
      (user.role === 'ADMIN' || employee.managerId === user.id),
    ),
    [employees, user.id, user.role],
  )

  const filteredEmployees = useMemo(() => {

    const normalizedSearch = search.trim().toLowerCase()
    return employees.filter((employee) => {
      const matchesRole = roleFilter === 'ALL' || employee.role === roleFilter
      const matchesSearch = !normalizedSearch || [
        fullName(employee),
        employee.email,
        employee.department,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch))
      return matchesRole && matchesSearch
    })
  }, [employees, roleFilter, search])

  useEffect(() => {
    if (!selectedEmployee) {
      return
    }
    let active = true
    attendanceApi.summary(token, { employeeId: selectedEmployee, month: selectedMonth })
      .then((summary) => { if (active) setTeamSummary(summary) })
      .catch((requestError) => { if (active) setSummaryError(requestError.message) })
    return () => { active = false }
  }, [selectedEmployee, selectedMonth, token])

  function updateNewEmployee(field, value) {
    setNewEmployee((current) => ({ ...current, [field]: value }))
  }

  async function createEmployee(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    const employee = {
      ...newEmployee,
      email: newEmployee.email.trim(),
      firstName: newEmployee.firstName.trim(),
      lastName: newEmployee.lastName.trim(),
      ...(newEmployee.department.trim() ? { department: newEmployee.department.trim() } : { department: undefined }),
      ...(newEmployee.managerId ? { managerId: newEmployee.managerId } : { managerId: undefined }),
    }

    try {
      await employeesApi.create(token, employee)
      setNewEmployee(blankEmployee)
      setShowCreate(false)
      setNotice('Employee created successfully.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function startEdit(employee) {
    setEditingId(employee.id)
    setEditForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role,
      department: employee.department ?? '',
      managerId: employee.managerId ?? '',
    })
    setError('')
    setNotice('')
  }

  async function saveEdit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await employeesApi.update(token, editingId, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        role: editForm.role,
        department: editForm.department.trim() || null,
        managerId: editForm.managerId || null,
      })
      setEditingId(null)
      setNotice('Employee details updated.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function deactivate(employee) {
    if (!window.confirm(`Deactivate ${fullName(employee)}? Their historical attendance and leave records will remain available.`)) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await employeesApi.deactivate(token, employee.id)
      setNotice(`${fullName(employee)} has been deactivated.`)
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
      {notice && <p className="alert alert-success" role="status">{notice}</p>}

      <section className="panel directory-panel">
        <div className="panel-heading directory-heading">
          <div><h2>People directory</h2><p>{employees.length} people in your organization</p></div>
          {isAdmin && (
            <button className="button button-primary" type="button" onClick={() => setShowCreate((visible) => !visible)}>
              <Icon name={showCreate ? 'close' : 'plus'} size={17} /> {showCreate ? 'Close form' : 'Add employee'}
            </button>
          )}
        </div>
        {showCreate && isAdmin && (
          <form className="create-employee-form" onSubmit={createEmployee}>
            <div className="form-section-heading"><strong>Add a team member</strong><span>They can sign in once their account is created.</span></div>
            <div className="form-grid form-grid-three">
              <label className="field-label">First name<input value={newEmployee.firstName} onChange={(event) => updateNewEmployee('firstName', event.target.value)} required /></label>
              <label className="field-label">Last name<input value={newEmployee.lastName} onChange={(event) => updateNewEmployee('lastName', event.target.value)} required /></label>
              <label className="field-label">Work email<input type="email" value={newEmployee.email} onChange={(event) => updateNewEmployee('email', event.target.value)} required /></label>
              <label className="field-label">Temporary password<input type="password" value={newEmployee.password} onChange={(event) => updateNewEmployee('password', event.target.value)} minLength="8" required /></label>
              <label className="field-label">Role<select value={newEmployee.role} onChange={(event) => updateNewEmployee('role', event.target.value)}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
              <label className="field-label">Department<input value={newEmployee.department} onChange={(event) => updateNewEmployee('department', event.target.value)} placeholder="e.g. Engineering" /></label>
              <label className="field-label">Manager <span className="optional-label">Optional</span>
                <select value={newEmployee.managerId} onChange={(event) => updateNewEmployee('managerId', event.target.value)}>
                  <option value="">No manager</option>
                  {activeManagers.map((manager) => <option value={manager.id} key={manager.id}>{fullName(manager)} - {manager.role}</option>)}
                </select>
              </label>
            </div>
            <div className="form-actions"><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Creating...' : 'Create employee'}</button></div>
          </form>
        )}

        <div className="directory-filters">
          <label className="search-field"><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people..." /><span className="sr-only">Search people</span></label>
          <label className="filter-select"><span className="sr-only">Filter by role</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="ALL">All roles</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
        </div>

        <div className="table-scroll">
          <table className="people-table">
            <thead><tr><th>Employee</th><th>Role</th><th>Department</th><th>Manager</th><th>Status</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan={isAdmin ? 6 : 5}><div className="table-empty"><span className="empty-symbol"><Icon name="users" /></span><strong>No people found</strong><small>Try adjusting your search or filter.</small></div></td></tr>
              ) : filteredEmployees.map((employee) => editingId === employee.id ? (
                <tr key={employee.id} className="editing-row">
                  <td colSpan={isAdmin ? 6 : 5}>
                    <form className="edit-employee-form" onSubmit={saveEdit}>
                      <div className="form-grid form-grid-three">
                        <label className="field-label">First name<input value={editForm.firstName} onChange={(event) => setEditForm({ ...editForm, firstName: event.target.value })} required /></label>
                        <label className="field-label">Last name<input value={editForm.lastName} onChange={(event) => setEditForm({ ...editForm, lastName: event.target.value })} required /></label>
                        <label className="field-label">Role<select value={editForm.role} disabled={employee.id === user.id} onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
                        <label className="field-label">Department<input value={editForm.department} onChange={(event) => setEditForm({ ...editForm, department: event.target.value })} /></label>
                        <label className="field-label">Manager<select value={editForm.managerId} onChange={(event) => setEditForm({ ...editForm, managerId: event.target.value })}><option value="">No manager</option>{activeManagers.filter((manager) => manager.id !== employee.id).map((manager) => <option value={manager.id} key={manager.id}>{fullName(manager)} - {manager.role}</option>)}</select></label>
                      </div>
                      <div className="form-actions"><button className="button button-secondary" type="button" onClick={() => setEditingId(null)}>Cancel</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={employee.id}>
                  <td><span className="employee-cell"><span className="avatar avatar-small">{initials(employee)}</span><span><strong className="table-primary">{fullName(employee)}</strong><small>{employee.email}</small></span></span></td>
                  <td><span className={`role-pill role-${employee.role.toLowerCase()}`}>{employee.role}</span></td>
                  <td>{employee.department || <span className="muted">--</span>}</td>
                  <td>{managerById.get(employee.managerId) || <span className="muted">--</span>}</td>
                  <td><span className={`status-pill ${employee.isActive ? 'status-active' : 'status-inactive'}`}>{employee.isActive ? 'Active' : 'Inactive'}</span></td>
                  {isAdmin && <td><div className="row-actions">
                    <button className="icon-button action-edit" type="button" title={`Edit ${fullName(employee)}`} aria-label={`Edit ${fullName(employee)}`} onClick={() => startEdit(employee)}><Icon name="edit" size={16} /></button>
                    {employee.isActive && employee.id !== user.id && <button className="icon-button action-deactivate" type="button" title={`Deactivate ${fullName(employee)}`} aria-label={`Deactivate ${fullName(employee)}`} disabled={busy} onClick={() => deactivate(employee)}><Icon name="ban" size={16} /></button>}
                  </div></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="directory-footer">Showing {filteredEmployees.length} of {employees.length} people</div>
      </section>

      <section className="panel team-attendance-panel">
        <div className="panel-heading table-heading">
          <div><h2>Team attendance summary</h2><p>Monthly totals for employees you are permitted to view.</p></div>
          <div className="team-summary-controls">
            <label><span className="sr-only">Select employee</span><select value={selectedEmployee} onChange={(event) => { setSelectedEmployee(event.target.value); setTeamSummary(null); setSummaryError('') }}><option value="">Select a person</option>{attendancePeople.map((employee) => <option value={employee.id} key={employee.id}>{fullName(employee)}{!employee.isActive ? ' (inactive)' : ''}</option>)}</select></label>
            <label><span className="sr-only">Select month</span><input type="month" value={selectedMonth} onChange={(event) => { setSelectedMonth(event.target.value); setTeamSummary(null); setSummaryError('') }} /></label>
          </div>
        </div>
        {summaryError && <p className="alert alert-error inline-alert" role="alert">{summaryError}</p>}
        {!selectedEmployee ? (
          <div className="summary-placeholder"><span className="empty-symbol"><Icon name="clock" /></span><p>Select a team member to view their monthly summary.</p></div>
        ) : teamSummary ? (
          <div className="team-summary-cards">
            <div><span>HOURS WORKED</span><strong>{formatHours(teamSummary.totalHours)}</strong></div>
            <div><span>DAYS PRESENT</span><strong>{teamSummary.daysPresent}</strong></div>
            <div><span>OPEN SESSIONS</span><strong>{teamSummary.openSessions}</strong></div>
          </div>
        ) : !summaryError && <p className="summary-loading">Loading attendance summary...</p>}
      </section>
    </div>
  )
}
