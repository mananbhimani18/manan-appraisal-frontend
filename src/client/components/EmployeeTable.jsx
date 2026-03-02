import React, { useState, useEffect } from 'react'

function EmployeeTable({
  employees,
  onSort,
  onEdit,
  onViewDetails,
  onDelete,
  onContextMenu,
  sortKey,
  sortOrder,
  showInvalid = false,
  perms = {},
  showViewMore = true,
  selectedRows = new Set(),
  setSelectedRows = () => {}
}) {
const [openRowMenu, setOpenRowMenu] = useState(null)
useEffect(() => {
  const handleClickOutside = () => {
    setOpenRowMenu(null);
  };

  window.addEventListener("click", handleClickOutside);

  return () => {
    window.removeEventListener("click", handleClickOutside);
  };
}, []);
  const formatMoney = (n) => {
    if (n === null || n === undefined) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
  }

  const renderSortIndicator = (key) => {
    if (sortKey !== key) return '↑↓'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const handleRowClick = (e, id) => {
  if (!e.ctrlKey) {
    setSelectedRows(new Set([id]))
  } else {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }
}
  return (
    <div className="table-wrap">
    <table id="employees">
      <thead>
        <tr>
          <th data-key="id" onClick={() => onSort('id')} style={{ cursor: 'pointer' }}>
            ID <span className="sort">{renderSortIndicator('id')}</span>
          </th>
          <th data-key="name" onClick={() => onSort('name')} style={{ cursor: 'pointer' }}>
            Name <span className="sort">{renderSortIndicator('name')}</span>
          </th>
          <th data-key="department" onClick={() => onSort('department')} style={{ cursor: 'pointer' }}>
            Department <span className="sort">{renderSortIndicator('department')}</span>
          </th>
          {!showInvalid && (
            <>
              <th className="num" data-key="currentsalary" onClick={() => onSort('currentsalary')} style={{ cursor: 'pointer' }}>
                Current Salary <span className="sort">{renderSortIndicator('currentsalary')}</span>
              </th>
              <th data-key="grade" onClick={() => onSort('grade')} style={{ cursor: 'pointer' }}>
                Grade <span className="sort">{renderSortIndicator('grade')}</span>
              </th>
              <th className="num" data-key="increment" onClick={() => onSort('increment')} style={{ cursor: 'pointer' }}>
                Increment (%) <span className="sort">{renderSortIndicator('increment')}</span>
              </th>
              <th className="num" data-key="incrementedsalary" onClick={() => onSort('incrementedsalary')} style={{ cursor: 'pointer' }}>
                Incremented Salary <span className="sort">{renderSortIndicator('incrementedsalary')}</span>
              </th>
            </>
          )}
          {showInvalid && (
            <>
              <th className="num" data-key="currentsalary" onClick={() => onSort('currentsalary')} style={{ cursor: 'pointer' }}>Current Salary <span className="sort">{renderSortIndicator('currentsalary')}</span></th>
              <th className="num" data-key="kpiscore" onClick={() => onSort('kpiscore')} style={{ cursor: 'pointer' }}>KPI <span className="sort">{renderSortIndicator('kpiscore')}</span></th>
              <th className="num" data-key="attendance" onClick={() => onSort('attendance')} style={{ cursor: 'pointer' }}>Attendance <span className="sort">{renderSortIndicator('attendance')}</span></th>
              <th className="num" data-key="behavioralrating" onClick={() => onSort('behavioralrating')} style={{ cursor: 'pointer' }}>Behavior <span className="sort">{renderSortIndicator('behavioralrating')}</span></th>
              <th className="num" data-key="managerrating" onClick={() => onSort('managerrating')} style={{ cursor: 'pointer' }}>Manager <span className="sort">{renderSortIndicator('managerrating')}</span></th>
            </>
          )}
          <th data-key="actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        {employees.map((emp) => (
          <tr
                key={emp.id}
                data-id={emp.id}
                onClick={(e) => handleRowClick(e, emp.id)}
                onContextMenu={(e) => {
                e.preventDefault();
                              
                if (!selectedRows.has(emp.id)) {
                  setSelectedRows(new Set([emp.id]));
                }
              
                onContextMenu?.(e);
              }}
                className={selectedRows.has(emp.id) ? "selected-row" : ""}
              >
            <td>{emp.id}</td>
            <td>{emp.name}</td>
            <td>{emp.department}</td>
            {!showInvalid && (
              <>
                <td className="num">{formatMoney(emp.currentsalary)}</td>
                <td>{emp.grade}</td>
                <td className="num">{emp.increment ? `${emp.increment}%` : '—'}</td>
                <td className="num">{formatMoney(emp.incrementedsalary)}</td>
              </>
            )}
            {showInvalid && (
              <>
                <td className="num">{formatMoney(emp.currentsalary)}</td>
                <td className="num">{emp.kpiscore ?? '—'}</td>
                <td className="num">{emp.attendance ?? '—'}</td>
                <td className="num">{emp.behavioralrating ?? '—'}</td>
                <td className="num">{emp.managerrating ?? '—'}</td>
              </>
            )}
            <td>
              <div className="actions-cell">
                <div className="actions-menu">
  <button
    className="menu-trigger"
    onClick={(e) => {
      e.stopPropagation();
      setOpenRowMenu(openRowMenu === emp.id ? null : emp.id);
    }}
  >
    ⋮
  </button>
                  {openRowMenu === emp.id && (
                    <div className="menu-actions">
                      {showViewMore && (
                        <button
                          className="action-btn view"
                          title="View Details"
                          onClick={(e) => {
  e.stopPropagation()
  onViewDetails(emp.id)
}}
                        >
                          👁️
                        </button>
                      )}
                      {perms.can_update && (
                        <button
                          className="action-btn edit"
                          title="Edit"
                          onClick={(e) => {
  e.stopPropagation()
  onEdit(emp)
}}
                        >
                          ✎
                        </button>
                      )}
                      {perms?.can_delete === true && (
                        <button
                          className="action-btn delete"
                          title="Delete"
                          onClick={(e) => {
                          e.stopPropagation()
                          onDelete(emp.id)
                        }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  )
}

export default EmployeeTable
