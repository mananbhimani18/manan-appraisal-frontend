import React, { useState, useEffect, useCallback } from "react";
import UserMenu from "../components/UserMenu";
import EmployeeTable from "../components/EmployeeTable";
import Modal from "../components/Modal";
import Summary from "../components/Summary";
import ChangePasswordForm from "../components/ChangePasswordForm";
import AddUserForm from "../components/AddUserForm";
import SetRoleForm from "../components/SetRoleForm";
import DeleteUserForm from "../components/DeleteUserForm";
import EditEmployeeForm from "../components/EditEmployeeForm";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";
import { useNavigate } from "react-router-dom";
import logo from "../pages/logo.png";
import Skeleton from "react-loading-skeleton";
import { motion } from "framer-motion";
import ContextMenu from "../components/ContextMenu";
import ChatButton from "../components/ChatButton";  // chatbot UI
import themeIcon from "../../assets/icons/theme-color.png";


function DashboardPage({ user, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [invalidData, setInvalidData] = useState([]);
  const [weights, setWeights] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sortKey, setSortKey] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [modal, setModal] = useState({ isOpen: false, title: "", content: "" });
  const [showWeights, setShowWeights] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [perms, setPerms] = useState({
    can_add: false,
    can_update: false,
    can_delete: false,
  });
  const [role, setRole] = useState("hr");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  const [toast, setToast] = useState(null);
  useEffect(() => {
  if (!toast) return;

  const timer = setTimeout(() => {
    setToast(null);
  }, 2500); // toast disappears after 2.5s

  return () => clearTimeout(timer);
}, [toast]);
  const [deletedBuffer, setDeletedBuffer] = useState(null);

  useEffect(() => {
  if (!deletedBuffer) return;

  const timer = setTimeout(async () => {
    await Promise.all(
      deletedBuffer.ids.map(id =>
        fetch(`/api/employeedetails/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actor: localStorage.getItem("user"),
          }),
        })
      )
    );

    setDeletedBuffer(null);
    setToast(null);
  }, 5000);

  return () => clearTimeout(timer);
}, [deletedBuffer]);

  const navigate = useNavigate();
  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const empRes = await fetch("/api/employees");
      if (!empRes.ok) throw new Error("Failed to fetch employees");

      const data = await empRes.json();
      setEmployees(data);

      const depts = [...new Set(data.map((e) => e.department).filter(Boolean))];
      const grds = [...new Set(data.map((e) => e.grade).filter(Boolean))];

      setDepartments(depts.sort());
      setGrades(grds.sort());
    } catch (error) {
      setModal({
        isOpen: true,
        title: "Error",
        content: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees and permissions
  const hasFetched = React.useRef(false)

useEffect(() => {
  if (hasFetched.current) return
  hasFetched.current = true

  const fetchData = async () => {
      try {
        setLoading(true);
        await fetchEmployees();

        // attempt to fetch permissions/role for current user
        const username = localStorage.getItem("user") || user;
        if (username) {
          try {
            const r = await fetch(
              `/api/permissions/${encodeURIComponent(username)}`,
            );
            if (r.ok) {
              const p = await r.json();

              setPerms({
                can_add:
                  p?.can_add === true ||
                  p?.can_add === "true" ||
                  p?.can_add === 1,
                can_update:
                  p?.can_update === true ||
                  p?.can_update === "true" ||
                  p?.can_update === 1,
                can_delete:
                  p?.can_delete === true ||
                  p?.can_delete === "true" ||
                  p?.can_delete === 1,
              });
            }
          } catch (_) {}
          try {
            const who = await fetch(`/api/whoami`, {
              headers: { "x-user": username },
            });
            if (who.ok) {
              const wr = await who.json();
              setRole((wr.role || "hr").toLowerCase());
            }
          } catch (_) {}
        }
      } catch (error) {
        console.error("Data fetch failed:", error);
        setModal({
          isOpen: true,
          title: "Error",
          content: `Failed to load data: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest(".custom-context-menu")) {
        setContextMenu({ visible: false, x: 0, y: 0 });
      }
    };

    window.addEventListener("click", handleGlobalClick);

    return () => {
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== "Escape") return;

      // 1️⃣ Close confirm delete modal FIRST
      if (confirmDeleteOpen) {
        setConfirmDeleteOpen(false);
        return;
      }

      // 2️⃣ Close normal modal
      if (modal.isOpen) {
        handleCloseModal();
        return;
      }

      // 3️⃣ Close context menu
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0 });
        return;
      }

      // 4️⃣ Deselect rows
      if (selectedRows.size > 0) {
        setSelectedRows(new Set());
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [
    confirmDeleteOpen, // ✅ add this
    modal.isOpen,
    contextMenu.visible,
    selectedRows,
  ]);

  useEffect(() => {
  const handleDeleteKey = (e) => {
    const tag = document.activeElement?.tagName?.toLowerCase();

    // ❌ Don't trigger while typing in input
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    // Only trigger on Delete key
    if (e.key === "Delete") {
      if (selectedRows.size > 0 && perms.can_delete) {
        e.preventDefault();
        setConfirmDeleteOpen(true);
      }
    }
  };

  window.addEventListener("keydown", handleDeleteKey);

  return () => {
    window.removeEventListener("keydown", handleDeleteKey);
  };
}, [selectedRows.size, perms.can_delete]);

  

  useEffect(() => {
    const handleKeyPress = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();

      // prevent toggle while typing in inputs
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key.toLowerCase() === "t") {
        handleToggleTheme();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

    const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
useEffect(() => {
  const handleSelectAll = (e) => {
    const tag = document.activeElement?.tagName?.toLowerCase();

    if (tag === "input" || tag === "textarea" || tag === "select") return;

    if (e.ctrlKey && e.key.toLowerCase() === "a") {
      e.preventDefault();

      const currentPageIds = paginatedEmployees.map(emp => emp.id);

      setSelectedRows(prev => {
        const allSelected = currentPageIds.every(id => prev.has(id));

        if (allSelected) {
          return new Set();
        }

        return new Set(currentPageIds); // select all
      });
    }
  };

  window.addEventListener("keydown", handleSelectAll);

  return () => {
    window.removeEventListener("keydown", handleSelectAll);
  };
}, [paginatedEmployees]);

  // Filter and sort employees
  useEffect(() => {
    let filtered = [...employees];

    // Apply filters
    if (searchQuery) {
      filtered = filtered.filter(
        (e) =>
          String(e.id).includes(searchQuery) ||
          (e.name && e.name.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter((e) => e.department === departmentFilter);
    }

    if (gradeFilter) {
      filtered = filtered.filter((e) => e.grade === gradeFilter);
    }

    // Sort (handle numeric-like values numerically)
    filtered.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      const isNumeric = (v) =>
        v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v));

      if (isNumeric(aVal) && isNumeric(bVal)) {
        return sortOrder === "asc"
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal);
      }

      if (aVal === null || aVal === undefined) aVal = "";
      if (bVal === null || bVal === undefined) bVal = "";

      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredEmployees(filtered);
  }, [
    employees,
    searchQuery,
    departmentFilter,
    gradeFilter,
    sortKey,
    sortOrder,
  ]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredEmployees, pageSize, currentPage]);

  const handleSort = (key) => {
  if (sortKey === key) {
    setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
  } else {
    setSortKey(key);
    setSortOrder("asc");
  }
};

  const handleContextMenu = (e) => {
    e.preventDefault();

    if (selectedRows.size === 0) return;

    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
    });
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Department",
      "Current Salary",
      "Grade",
      "Increment (%)",
      "Incremented Salary",
    ];
    const rows = filteredEmployees.map((e) => [
      e.id,
      e.name,
      e.department,
      e.currentsalary,
      e.grade,
      e.increment,
      e.incrementedsalary,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employees.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleShowWeights = () => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/weights");
        if (!res.ok) throw new Error("Failed to fetch weights");
        const w = await res.json();
        setWeights(w);
        setShowWeights(true);
        setShowInvalid(false);
        setModal({ isOpen: true, title: "Weights" });
      } catch (e) {
        setModal({ isOpen: true, title: "Error", content: e.message });
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleShowInvalid = () => {
    // Navigate to dedicated invalid-data page instead of modal
    if (!showInvalid) {
      navigate("/invalid");
    } else {
      // if already open locally, close modal/state
      setShowInvalid(false);
      setModal({ isOpen: false, title: "" });
    }
  };

  const handleEdit = (employee) => {
    // sanitize employee fields (no null/undefined) before opening edit modal
    const sanitized = { ...employee };
    Object.keys(sanitized).forEach((k) => {
      if (sanitized[k] === null || sanitized[k] === undefined)
        sanitized[k] = "";
    });
    setModal({
      isOpen: true,
      title: `Edit Employee #${employee.id}`,
      form: { type: "edit-employee", data: sanitized, isInvalid: false },
    });
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await fetch(`/api/employees/${id}/inputdetails`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const details = await res.json();

      setModal({
        isOpen: true,
        title: `Employee Input Details #${id}`,
        details,
      });
    } catch (error) {
      setModal({
        isOpen: true,
        title: "Error",
        content: `Failed to load details: ${error.message}`,
      });
    }
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, title: "", content: "" });
    setShowWeights(false);
    setShowInvalid(false);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    try {
      const url = showInvalid
        ? `/api/invaliddata/${id}`
        : `/api/employeedetails/${id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: localStorage.getItem("user") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      // refresh lists
      await fetchEmployees();
      if (showInvalid) {
        const invRes = await fetch("/api/invalid");
        if (invRes.ok) setInvalidData(await invRes.json());
      }
      setModal({ isOpen: false, title: "" });
    } catch (e) {
      setModal({ isOpen: true, title: "Error", content: e.message });
    }
  };

  // User menu actions
  const handleToggleTheme = () => {
    const themes = [
      "hulk",
      "thanos",
      "frost",
      "batman",
      "light",
      "emerald",
      "ocean",
      "sunset",
      "spiderman",
      "deep",
      "violet",
      "contrast",
      "red",
    ];
    const current = localStorage.getItem("theme") || "hulk";
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    localStorage.setItem("theme", next);
    document.body.setAttribute("data-theme", next);

    // ✅ create floating theme label (NO JSX used)
    const el = document.createElement("div");
    el.innerText = `Theme: ${next}`;

    Object.assign(el.style, {
      position: "fixed",
      top: "20px", // ⭐ center-top position
      left: "50%",
      transform: "translateX(-50%)", // only horizontal centering
      padding: "14px 24px",
      borderRadius: "12px",
      background: "rgba(0,0,0,0.75)",
      color: "#fff",
      fontSize: "18px",
      fontWeight: "600",
      zIndex: 9999,
      backdropFilter: "blur(6px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      opacity: "1",
      transition: "opacity 0.4s ease",
    });

    document.body.appendChild(el);

    // fade + remove
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 400);
    }, 2000);
  };

  const handleChangePassword = () => {
    // render change password form
    setModal({
      isOpen: true,
      title: "Change Password",
      form: { type: "change-password" },
    });
  };

  const handleAddUser = () =>
    setModal({ isOpen: true, title: "Add User", form: { type: "add-user" } });

  const handleSetRole = async () => {
    // fetch users for select
    try {
      const res = await fetch("/api/users");
      const users = res.ok ? await res.json() : [];
      setModal({
        isOpen: true,
        title: "Set Role",
        form: { type: "set-role", users },
      });
    } catch (_) {
      setModal({
        isOpen: true,
        title: "Set Role",
        form: { type: "set-role", users: [] },
      });
    }
  };

  const handleDeleteUser = async () => {
    try {
      const res = await fetch("/api/users");
      const users = res.ok ? await res.json() : [];
      setModal({
        isOpen: true,
        title: "Delete User",
        form: { type: "delete-user", users },
      });
    } catch (_) {
      setModal({
        isOpen: true,
        title: "Delete User",
        form: { type: "delete-user", users: [] },
      });
    }
  };


const selectedIds = [...selectedRows];
const contextActions = [];
// 🔹 COPY AS EXCEL (single row)
if (selectedIds.length === 1) {
  contextActions.push({
    label: "Copy as Excel",
    icon: "📊",
    onClick: () => {
      const emp = filteredEmployees.find(e => e.id === selectedIds[0]);
      if (!emp) return;

      const text =
`ID\tName\tDepartment\tCurrent Salary\tGrade\tIncrement (%)\tIncremented Salary
${emp.id}\t${emp.name}\t${emp.department}\t${emp.currentsalary ?? ""}\t${emp.grade ?? ""}\t${emp.increment ?? ""}\t${emp.incrementedsalary ?? ""}`;

      navigator.clipboard.writeText(text);

      setToast(`Copied ${emp.id} to Excel`);
      setContextMenu({ visible: false, x: 0, y: 0 });
    }
  });
}

// 🔹 MULTIPLE ROWS → Export Selected
if (selectedIds.length > 1) {
  contextActions.push({
    label: `Export Selected (${selectedIds.length})`,
    icon: "📤",
    onClick: () => {
      const selectedRecords = filteredEmployees.filter(e =>
  selectedIds.includes(e.id)
);

      const headers = [
        "ID",
        "Name",
        "Department",
        "Current Salary",
        "Grade",
        "Increment (%)",
        "Incremented Salary",
      ];

      const rows = selectedRecords.map(e => [
        e.id,
        e.name,
        e.department,
        e.currentsalary,
        e.grade,
        e.increment,
        e.incrementedsalary,
      ]);

      const csv = [headers, ...rows]
        .map(r => r.map(c => `"${c ?? ""}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "selected_employees.csv";
      a.click();
      URL.revokeObjectURL(url);

      setContextMenu({ visible: false, x: 0, y: 0 });
    }
  });
}

// 🔹 DELETE (single or multi)
if (selectedIds.length >= 1 && perms.can_delete) {
  contextActions.push({
    label:
      selectedIds.length === 1
        ? "Delete Record"
        : `Delete Selected (${selectedIds.length})`,
    icon: "🗑",
    onClick: () => {
      setConfirmDeleteOpen(true);
      setContextMenu({ visible: false, x: 0, y: 0 });
    }
  });
}
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));

  if (loading) {
    return (
      <>
        <header>
          <div className="logo-wrap">
            <Skeleton circle={true} height={42} width={42} />
          </div>
          <h1 style={{ margin: 0 }}>
            <Skeleton height={22} width={180} />
          </h1>
          <div id="status" style={{ marginLeft: 8 }}>
            <Skeleton height={14} width={60} />
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Skeleton circle={true} height={28} width={28} />
            <Skeleton height={36} width={80} />
          </div>
        </header>

        <main style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Skeleton height={36} width={180} />
            <Skeleton height={36} width={180} />
            <Skeleton height={36} width={120} />
          </div>
          <Skeleton count={10} height={42} style={{ marginTop: 15 }} />
        </main>
      </>
    );
  }

  return (
    <>
      <header>
        <div className="logo-wrap">
          <img
            src={logo}
            alt="TecnoPrism"
            className="brand"
            onError={(e) => e.target.remove()}
          />
        </div>
        <h1 className="header-title">
          {showInvalid
            ? "Employee Invalid Data"
            : "Employee Incremented Details"}
        </h1>
        <button
          type="button"
          className="theme-btn"
          title="Press (T) to Toggle Theme"
          onClick={handleToggleTheme}
        >
          <img src={themeIcon} alt="Theme" className="theme-icon" />
        </button>

        <UserMenu
          user={user}
          onLogout={onLogout}
          onChangePassword={handleChangePassword}
          onAddUser={handleAddUser}
          onSetRole={handleSetRole}
          onDeleteUser={handleDeleteUser}
          onToggleTheme={handleToggleTheme}
        />
      </header>

      <main>
        <motion.section
          id="controls"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <input
            id="q"
            type="search"
            placeholder="Search name or ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            id="dept"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            id="grade"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option value="">All Grades</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
          <button
            id="weights"
            type="button"
            onClick={handleShowWeights}
            title="View weight distribution graph"
            style={{ color: "aliceblue" }}
          >
            Weights
          </button>
          <button
            id="invalid"
            type="button"
            onClick={handleShowInvalid}
            title="View invalid data"
            style={{ color: "aliceblue" }}
          >
            {showInvalid ? "Incremented Data" : "Invalid Data"}
          </button>
          <button
            id="export"
            type="button"
            onClick={handleExportCSV}
            title="Export CSV of Incremented Data"
            style={{ color: "aliceblue" }}
          >
            Export CSV
          </button>
         <button
  type="button"
  onClick={fetchEmployees}
  title="Refresh Data"
  style={{
    color: "aliceblue",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15" />
  </svg>
</button>

          <span className="spacer"></span>
          <span className="record-count">
            {filteredEmployees.length === 0
              ? "No employees found"
              : `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(
                  currentPage * pageSize,
                  filteredEmployees.length
                )} of ${filteredEmployees.length} employees`}
          </span>
          <label>
            Rows:
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </label>
          <div id="pager">
            <button
              id="prev"
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span id="pageInfo">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              id="next"
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </motion.section>

        <div style={{ marginTop: 12 }}>
          <Summary employees={paginatedEmployees} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          <EmployeeTable
            employees={paginatedEmployees}
            onSort={handleSort}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            onDelete={handleDelete}
            onContextMenu={handleContextMenu}
            sortKey={sortKey}
            sortOrder={sortOrder}
            showInvalid={showInvalid}
            perms={perms}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
          />
        </motion.div>
      <ContextMenu
  visible={contextMenu.visible}
  x={contextMenu.x}
  y={contextMenu.y}
  actions={contextActions}
/>
      </main>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        onClose={handleCloseModal}
      >
        {showWeights && (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <PieChart
              values={weights.map((w) => w.weightpercentage)}
              labels={weights.map((w) => w.metric)}
            />
            <div style={{ flex: 1 }}>
              <h3>Weights</h3>
              <p style={{ color: "var(--muted)" }}>
                Hover a segment to see metric and percentage.
              </p>
            </div>
          </div>
        )}

        {showInvalid && (
          <table className="detail">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Department</th>
                <th className="num">Salary</th>
                <th className="num">KPI</th>
                <th className="num">Attendance</th>
                <th className="num">Behavior</th>
                <th className="num">Manager</th>
              </tr>
            </thead>
            <tbody>
              {invalidData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.department}</td>
                  <td className="num">{item.currentsalary}</td>
                  <td className="num">{item.kpiscore}</td>
                  <td className="num">{item.attendance}</td>
                  <td className="num">{item.behavioralrating}</td>
                  <td className="num">{item.managerrating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {modal.details && (
          <div>
            <table className="detail" style={{ marginBottom: 12 }}>
              <tbody>
                <tr>
                  <th>ID</th>
                  <td>{modal.details.id}</td>
                </tr>
                <tr>
                  <th>Name</th>
                  <td>{modal.details.name}</td>
                </tr>
                <tr>
                  <th>Department</th>
                  <td>{modal.details.department}</td>
                </tr>
              </tbody>
            </table>
            <BarChart
              values={[
                modal.details.kpiscore,
                modal.details.attendance,
                modal.details.behavioralrating,
                modal.details.managerrating,
              ]}
              labels={[
                "KPI Score",
                "Attendance",
                "Behavioral Rating",
                "Manager Rating",
              ]}
              max={100}
            />
          </div>
        )}
        {/* Render form-based modals (change password, add user, set role, delete user, edit employee) */}
        {modal.form && modal.form.type === "change-password" && (
          <ChangePasswordForm onClose={handleCloseModal} />
        )}
        {modal.form && modal.form.type === "add-user" && (
          <AddUserForm onClose={handleCloseModal} />
        )}
        {modal.form && modal.form.type === "set-role" && (
          <SetRoleForm
            users={modal.form.users || []}
            onClose={handleCloseModal}
          />
        )}
        {modal.form && modal.form.type === "delete-user" && (
          <DeleteUserForm
            users={modal.form.users || []}
            onClose={handleCloseModal}
          />
        )}
        {modal.form && modal.form.type === "edit-employee" && (
          <EditEmployeeForm
            data={modal.form.data}
            isInvalid={modal.form.isInvalid}
            onClose={handleCloseModal}
          />
        )}
      </Modal>
      {confirmDeleteOpen && (
        <Modal
          isOpen={true}
          title="Confirm Delete"
          onClose={() => setConfirmDeleteOpen(false)}
        >
          <div style={{ padding: 20 }}>
            <p style={{ marginBottom: 20 }}>
              Are you sure you want to delete{" "}
              <strong>{selectedRows.size}</strong> record(s)?
            </p>

            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <button onClick={() => setConfirmDeleteOpen(false)}>
                Cancel
              </button>

              <button
                style={{
                  background: "#dc2626",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={async () => {
  const idsToDelete = [...selectedRows];

  const recordsToDelete = employees.filter(e =>
    idsToDelete.includes(e.id)
  );

  // 1️⃣ Remove from UI immediately
  setEmployees(prev =>
    prev.filter(e => !idsToDelete.includes(e.id))
  );

  // 2️⃣ Store deleted records in buffer
  setDeletedBuffer({
    records: recordsToDelete,
    ids: idsToDelete,
  });

  setToast(`${idsToDelete.length} record(s) deleted`);

  setSelectedRows(new Set());
  setContextMenu({ visible: false, x: 0, y: 0 });
  setConfirmDeleteOpen(false);
}}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
      {toast && (
  <div
    style={{
      position: "fixed",
      bottom: "100px",
      right: "20px",
      background: "#1f2937",
      color: "white",
      padding: "14px 20px",
      borderRadius: "8px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
      display: "flex",
      gap: "16px",
      alignItems: "center",
      zIndex: 9999,
    }}
  >
    <span>{toast}</span>

    {deletedBuffer && (
      <button
        onClick={() => {
          setEmployees(prev => [
            ...deletedBuffer.records,
            ...prev,
          ]);

          setDeletedBuffer(null);
          setToast(null);
        }}
        style={{
          background: "transparent",
          border: "none",
          color: "#60a5fa",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        UNDO
      </button>
    )}
  </div>
)}
      <ChatButton />
    </>
  );
}

export default DashboardPage;
