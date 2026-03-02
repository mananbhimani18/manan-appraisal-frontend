import React, { useState } from 'react'

export default function EditEmployeeForm({ data = {}, onClose, isInvalid = false }) {
  const [msg, setMsg] = useState('')
  const [errors, setErrors] = useState({})

  // common fields
  const [name, setName] = useState(data.name || '')
  const [department, setDepartment] = useState(data.department || '')
  const [currentsalary, setCurrentSalary] = useState(data.currentsalary || '')

  // invalid-data specific fields
  const [kpiscore, setKpiScore] = useState(data.kpiscore ?? '')
  const [attendance, setAttendance] = useState(data.attendance ?? '')
  const [behavioralrating, setBehavioralRating] = useState(data.behavioralrating ?? '')
  const [managerrating, setManagerRating] = useState(data.managerrating ?? '')

  // regular employee fields
  const [grade, setGrade] = useState(data.grade || '')
  const [increment, setIncrement] = useState(data.increment || '')
  const [incrementedsalary, setIncrementedSalary] = useState(data.incrementedsalary || '')

  const validateNumber = (val) => val === '' || val === null || val === undefined || !isNaN(Number(val))

  const validatePercentRange = (val) => {
    if (val === '' || val === null || val === undefined) return true
    const n = Number(val)
    return !isNaN(n) && n >= 0 && n <= 100
  }

  const handleSubmitInvalid = async (e) => {
    e.preventDefault(); setMsg('')
    const errs = {}
    if (!name) errs.name = 'Required'
    if (!department) errs.department = 'Required'
    if (currentsalary !== '' && !validateNumber(currentsalary)) errs.currentsalary = 'Invalid number'
    if (!validatePercentRange(kpiscore)) errs.kpiscore = 'Must be 0–100'
    if (!validatePercentRange(attendance)) errs.attendance = 'Must be 0–100'
    if (!validatePercentRange(behavioralrating)) errs.behavioralrating = 'Must be 0–100'
    if (!validatePercentRange(managerrating)) errs.managerrating = 'Must be 0–100'

    setErrors(errs)
    if (Object.keys(errs).length) return setMsg('Fix validation errors')

    try {
      const payload = {
        actor: localStorage.getItem('user'),
        name: name ?? '',
        department: department ?? '',
        currentsalary: currentsalary ?? '',
        kpiscore: kpiscore ?? '',
        attendance: attendance ?? '',
        behavioralrating: behavioralrating ?? '',
        managerrating: managerrating ?? ''
      }
      const res = await fetch(`/api/invaliddata/${data.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const d = await res.json().catch(()=>({}))
      if (!res.ok) throw new Error(d.error || res.statusText)
      setMsg('Saved')
      setTimeout(()=> window.location.reload(), 700)
    } catch (err) {
      setMsg(err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg('')
    const errs = {}
    if (!name) errs.name = 'Required'
    if (!department) errs.department = 'Required'
    if (currentsalary !== '' && !validateNumber(currentsalary)) errs.currentsalary = 'Invalid number'
    setErrors(errs)
    if (Object.keys(errs).length) return setMsg('Fix validation errors')

    try {
      const payload = {
        actor: localStorage.getItem('user'),
        name: name ?? '',
        department: department ?? '',
        currentsalary: currentsalary ?? '',
        grade: grade ?? '',
        increment: increment ?? '',
        incrementedsalary: incrementedsalary ?? ''
      }
      const res = await fetch(`/api/employeedetails/${data.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const d = await res.json().catch(()=>({}))
      if (!res.ok) throw new Error(d.error || res.statusText)
      setMsg('Saved')
      setTimeout(()=> window.location.reload(), 700)
    } catch (err) {
      setMsg(err.message)
    }
  }

  if (isInvalid) {
    return (
      <form className="card" style={{ padding: 12 }} onSubmit={handleSubmitInvalid}>
        <label>ID</label>
        <input value={data.id} readOnly />

        <label>Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} />
        {errors.name && <div className="field-error">{errors.name}</div>}

        <label>Department</label>
        <input value={department} onChange={e=>setDepartment(e.target.value)} />
        {errors.department && <div className="field-error">{errors.department}</div>}

        <label>Current Salary</label>
        <input type="number" step="0.01" value={currentsalary} onChange={e=>setCurrentSalary(e.target.value)} />
        {errors.currentsalary && <div className="field-error">{errors.currentsalary}</div>}

        <label>KPI Score</label>
        <input type="number" step="0.01" value={kpiscore} onChange={e=>setKpiScore(e.target.value)} />
        {errors.kpiscore && <div className="field-error">{errors.kpiscore}</div>}

        <label>Attendance</label>
        <input type="number" step="0.01" value={attendance} onChange={e=>setAttendance(e.target.value)} />
        {errors.attendance && <div className="field-error">{errors.attendance}</div>}

        <label>Behavioral Rating</label>
        <input type="number" step="0.01" value={behavioralrating} onChange={e=>setBehavioralRating(e.target.value)} />
        {errors.behavioralrating && <div className="field-error">{errors.behavioralrating}</div>}

        <label>Manager Rating</label>
        <input type="number" step="0.01" value={managerrating} onChange={e=>setManagerRating(e.target.value)} />
        {errors.managerrating && <div className="field-error">{errors.managerrating}</div>}

        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
          <button className="btn" type="submit">Save</button>
          <span style={{ color: msg && msg.includes('Saved') ? '#22c55e' : '#ef4444' }}>{msg}</span>
          <button type="button" className="btn" onClick={onClose} style={{ marginLeft:'auto' }}>Close</button>
        </div>
      </form>
    )
  }

  return (
    <form className="card" style={{ padding: 12 }} onSubmit={handleSubmit}>
      <label>ID</label>
      <input value={data.id} readOnly />

      <label>Name</label>
      <input value={name} onChange={e=>setName(e.target.value)} />
      {errors.name && <div className="field-error">{errors.name}</div>}

      <label>Department</label>
      <input value={department} onChange={e=>setDepartment(e.target.value)} />
      {errors.department && <div className="field-error">{errors.department}</div>}

      <label>Current Salary</label>
      <input type="number" step="0.01" value={currentsalary} onChange={e=>setCurrentSalary(e.target.value)} />
      {errors.currentsalary && <div className="field-error">{errors.currentsalary}</div>}

      <label>Grade</label>
      <input value={grade} onChange={e=>setGrade(e.target.value)} />

      <label>Increment %</label>
      <input type="number" step="0.01" value={increment} onChange={e=>setIncrement(e.target.value)} />

      <label>Incremented Salary</label>
      <input type="number" step="0.01" value={incrementedsalary} onChange={e=>setIncrementedSalary(e.target.value)} />

      <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
        <button className="btn" type="submit">Save</button>
        <span style={{ color: msg && msg.includes('Saved') ? '#22c55e' : '#ef4444' }}>{msg}</span>
        <button type="button" className="btn" onClick={onClose} style={{ marginLeft:'auto' }}>Close</button>
      </div>
    </form>
  )
}
