import React, { useState, useRef, useEffect } from 'react'

function UserMenu({ user, role, onLogout, onChangePassword, onAddUser, onSetRole, onDeleteUser, onActivityLog, onToggleTheme }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
const closeTimer = useRef(null);

  const handleTheme = () => {
    onToggleTheme && onToggleTheme()
    setIsOpen(false)
  }

  const handleClick = (cb) => {
    if (cb) cb()
    setIsOpen(false)
  }

  // ✅ close menu when clicking outside
  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  return (
    <div
  ref={menuRef}
  className="menu-wrap"
  onMouseEnter={() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setIsOpen(true);
  }}
  onMouseLeave={() => {
 closeTimer.current = setTimeout(() => {
  setIsOpen(false);
}, 200);
  }}
>
        <button
        id="userMenuBtn"
        type="button"
        className="btn btn-user"
        onClick={() => setIsOpen(!isOpen)}
      >
        {user} {role === "admin" ? "(Admin)" : ""} ▾
      </button>
      <div id="userMenu" className={`menu ${isOpen ? '' : 'hidden'}`} role="menu">
        <button type="button" className="menu-item" id="menuChangePassword" onClick={() => handleClick(onChangePassword)}>
          Change Password
        </button>
        {role === "admin" && (
  <>
    <button type="button" className="menu-item" id="menuAddUser" onClick={() => handleClick(onAddUser)}>
      Add User
    </button>

    <button type="button" className="menu-item" id="menuSetRole" onClick={() => handleClick(onSetRole)}>
      Set Role
    </button>

    <button type="button" className="menu-item" id="menuDeleteUser" onClick={() => handleClick(onDeleteUser)}>
      Delete User
    </button>

    <button
      type="button"
      className="menu-item"
      id="menuActivityLog"
      onClick={() => handleClick(onActivityLog)}
    >
      Activity Log
    </button>
  </>
)}
        {role === "admin" && <hr />}
        <button type="button" className="menu-item" id="menuTheme" onClick={() => handleTheme()}>
          Toggle Theme
        </button>
        <hr />
        <button
          type="button"
          className="menu-item"
          id="menuLogout"
          onClick={() => { setIsOpen(false); onLogout && onLogout(); }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default UserMenu
