import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeTable from "../components/EmployeeTable";
import Summary from "../components/Summary";
import Modal from "../components/Modal";
import BarChart from "../components/BarChart";
import EditEmployeeForm from "../components/EditEmployeeForm";
import UserMenu from "../components/UserMenu";
import PieChart from "../components/PieChart";
import logo from "../pages/logo.png";
import Skeleton from "react-loading-skeleton";
import AddUserForm from "../components/AddUserForm";
import SetRoleForm from "../components/SetRoleForm";
import { motion } from "framer-motion";
import ContextMenu from "../components/ContextMenu";
import themeIcon from "../../assets/icons/theme-color.png";
import { formatINR } from "../utils";
import FilterDropdown from "../components/FilterDropdown";
import PasswordResetForm from "../components/PasswordResetForm";
import DeleteUserForm from "../components/DeleteUserForm";

export default function InvalidDataPage({ user, onLogout }) {
  const [invalidData, setInvalidData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [invFilter, setInvFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [weights, setWeights] = useState([]);
  const [showWeights, setShowWeights] = useState(false);
  const [sortKey, setSortKey] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [perms, setPerms] = useState({
    can_add: false,
    can_update: false,
    can_delete: false,
  });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [role, setRole] = useState("hr");
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 2500); // toast disappears after 2.5s

    return () => clearTimeout(timer);
  }, [toast]);
  const [deletedBuffer, setDeletedBuffer] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const fetchInvalid = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/invalid");
      if (!res.ok) throw new Error("Failed to fetch invalid data");
      const data = await res.json();
      setInvalidData(data);
      // derive departments/grades from dataset
      setDepartments(
        [...new Set(data.map((d) => d.department).filter(Boolean))].sort(),
      );
      setGrades([...new Set(data.map((d) => d.grade).filter(Boolean))].sort());
    } catch (e) {
      console.error(e);
      setModal({ isOpen: true, title: "Error", content: e.message });
    } finally {
      setLoading(false);
    }
  };

//   useEffect(() => {
//   document.body.style.zoom = "0.8";
// }, []);
  useEffect(() => {
    fetchInvalid();
  }, []);
  const navigate = useNavigate();

  const handleViewDetails = async (id) => {
    try {
      const res = await fetch(`/api/employees/${id}/inputdetails`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const details = await res.json();
      setModal({ isOpen: true, title: `Details: ${id}`, details });
    } catch (e) {
      setModal({ isOpen: true, title: "Error", content: e.message });
    }
  };

  useEffect(() => {
    const fetchRole = async () => {
      const username = localStorage.getItem("user") || user;
      if (!username) return;

      try {
        const res = await fetch("/api/whoami", {
          headers: { "x-user": username },
        });

        if (res.ok) {
          const data = await res.json();
          setRole((data.role || "hr").toLowerCase());
        }
      } catch (err) {
        console.error("Role fetch failed", err);
      }
    };

    fetchRole();
  }, [user]);

  useEffect(() => {
    const fetchPermissions = async () => {
      const username = localStorage.getItem("user") || user;
      if (!username) return;

      try {
        const res = await fetch(`/api/permissions/${username}`);
        if (res.ok) {
          const p = await res.json();
          setPerms({
            can_add: !!p.can_add,
            can_update: !!p.can_update,
            can_delete: !!p.can_delete,
          });
        }
      } catch (err) {
        console.error("Permission fetch failed", err);
      }
    };

    fetchPermissions();
  }, [user]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      // only close if clicking outside context menu
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
    const handleFindShortcut = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault(); // stop browser find

        const input = document.getElementById("q");
        if (input) {
          input.focus();
          input.select();
        }
      }
    };

    window.addEventListener("keydown", handleFindShortcut);

    return () => {
      window.removeEventListener("keydown", handleFindShortcut);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== "Escape") return;

      if (confirmDeleteOpen) {
        setConfirmDeleteOpen(false);
        return;
      }

      if (modal.isOpen || showWeights) {
        setShowWeights(false);
        setModal({ isOpen: false });
        return;
      }

      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0 });
        return;
      }

      if (selectedRows.size > 0) {
        setSelectedRows(new Set());
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [
    confirmDeleteOpen,
    modal.isOpen,
    showWeights,
    contextMenu.visible,
    selectedRows.size,
  ]);

  useEffect(() => {
    if (!deletedBuffer) return;

    const timer = setTimeout(async () => {
      await Promise.all(
        deletedBuffer.ids.map((id) =>
          fetch(`/api/invaliddata/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actor: localStorage.getItem("user"),
            }),
          }),
        ),
      );

      setDeletedBuffer(null);
      setToast(null);
    }, 5000); // 5 seconds undo window

    return () => clearTimeout(timer);
  }, [deletedBuffer]);

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

    // ✅ floating theme label (must be inside function)
    const el = document.createElement("div");
    el.innerText = `Theme: ${next}`;

    Object.assign(el.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
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

  const handleContextMenu = (e) => {
    e.preventDefault();

    if (selectedRows.size === 0) return;

    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
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

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
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

  const handleEdit = (employee) => {
    // sanitize to avoid null values in the form
    const sanitized = { ...employee };
    Object.keys(sanitized).forEach((k) => {
      if (sanitized[k] === null || sanitized[k] === undefined)
        sanitized[k] = "";
    });
    setModal({
      isOpen: true,
      title: `Edit: ${employee.id}`,
      form: { type: "edit-employee", data: sanitized, isInvalid: true },
    });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/invaliddata/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: localStorage.getItem("user") }),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchInvalid();
      setModal({ isOpen: false });
    } catch (e) {
      setModal({ isOpen: true, title: "Error", content: e.message });
    }
  };

  const handleCloseModal = () => setModal({ isOpen: false });

  const handleShowWeights = async () => {
    try {
      setLoading(true);
      const res = await fetch("api/weights");
      if (!res.ok) throw new Error("Failed to fetch weights");
      const w = await res.json();
      setWeights(w);
      setShowWeights(true);
      setModal({ isOpen: true, title: "Weights" });
    } catch (e) {
      setModal({ isOpen: true, title: "Error", content: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Department",
      "Current Salary",
      "KPI",
      "Attendance",
      "Behavior",
      "Manager",
    ];
    const rows = filteredInvalid.map((i) => [
      i.id,
      i.name,
      i.department,
      i.currentsalary,
      i.kpiscore,
      i.attendance,
      i.behavioralrating,
      i.managerrating,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invalid.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // filtering + pagination
  const filteredInvalid = invalidData.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();

      if (
        ![
          item.id,
          item.name,
          item.department,
          item.currentsalary,
          item.kpiscore,
          item.attendance,
          item.behavioralrating,
          item.managerrating,
        ]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    if (departmentFilter && item.department !== departmentFilter) return false;
    if (gradeFilter && item.grade !== gradeFilter) return false;
    // invalid-specific filter mode
    if (invFilter && invFilter !== "all") {
      const isEmpty = (v) =>
        v === null || v === undefined || String(v).trim() === "";
      const isNum = (v) => !isEmpty(v) && isFinite(Number(v));
      const outOfRange = (v) => isNum(v) && (Number(v) < 0 || Number(v) > 100);
      const numericOnly = (s) => /^\d+$/.test(String(s).trim());
      if (invFilter === "nulls") {
        if (
          ![
            item.id,
            item.name,
            item.department,
            item.currentsalary,
            item.kpiscore,
            item.attendance,
            item.behavioralrating,
            item.managerrating,
          ].some(isEmpty)
        )
          return false;
      } else if (invFilter === "range") {
        if (
          ![
            item.kpiscore,
            item.attendance,
            item.behavioralrating,
            item.managerrating,
          ].some(outOfRange)
        )
          return false;
      } else if (invFilter === "nonnumeric") {
        if (
          ![
            item.currentsalary,
            item.kpiscore,
            item.attendance,
            item.behavioralrating,
            item.managerrating,
          ].some((v) => !isNum(v))
        )
          return false;
      } else if (invFilter === "numericText") {
        if (!(numericOnly(item.name) || numericOnly(item.department)))
          return false;
      }
    }
    return true;
  });

  const sortedInvalid = [...filteredInvalid].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];

    const isNumeric = (v) =>
      v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v));

    // If both values are numeric (or numeric-strings), compare numerically
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

  const paginated = sortedInvalid.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const selectedIds = [...selectedRows];
  const contextActions = [];
  // 🔹 COPY AS EXCEL (single row)
  if (selectedIds.length === 1) {
    contextActions.push({
      label: "Copy as Excel",
      icon: "📊",
      onClick: () => {
        const emp = sortedInvalid.find((i) => i.id === selectedIds[0]);
        if (!emp) return;

        const text = `ID\tName\tDepartment\tCurrent Salary\tKPI\tAttendance\tBehavior\tManager
${emp.id}\t${emp.name}\t${emp.department}\t${emp.currentsalary ?? ""}\t${emp.kpiscore ?? ""}\t${emp.attendance ?? ""}\t${emp.behavioralrating ?? ""}\t${emp.managerrating ?? ""}`;

        navigator.clipboard.writeText(text);

        setToast(`Copied ${emp.id} to Excel`);
        setContextMenu({ visible: false, x: 0, y: 0 });
      },
    });
  }

  // 🔹 MULTIPLE → Export Selected
  if (selectedIds.length > 1) {
    contextActions.push({
      label: `Export Selected (${selectedIds.length})`,
      icon: "📤",
      onClick: () => {
        const selectedRecords = sortedInvalid.filter((i) =>
          selectedIds.includes(i.id),
        );

        const headers = [
          "ID",
          "Name",
          "Department",
          "Current Salary",
          "KPI",
          "Attendance",
          "Behavior",
          "Manager",
        ];

        const rows = selectedRecords.map((i) => [
          i.id,
          i.name,
          i.department,
          i.currentsalary,
          i.kpiscore,
          i.attendance,
          i.behavioralrating,
          i.managerrating,
        ]);

        const csv = [headers, ...rows]
          .map((r) => r.map((c) => `"${c ?? ""}"`).join(","))
          .join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "selected_invalid.csv";
        a.click();
        URL.revokeObjectURL(url);

        setContextMenu({ visible: false, x: 0, y: 0 });
      },
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
      },
    });
  }
  const totalPages = Math.max(1, Math.ceil(filteredInvalid.length / pageSize));

  useEffect(() => {
    const handleSelectAll = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();

      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.ctrlKey && e.key.toLowerCase() === "a") {
        e.preventDefault();

        const currentPageIds = paginated.map((item) => item.id);

        setSelectedRows((prev) => {
          const allSelected = currentPageIds.every((id) => prev.has(id));

          if (allSelected) {
            return new Set(); // deselect
          }

          return new Set(currentPageIds); // select all
        });
      }
    };

    window.addEventListener("keydown", handleSelectAll);

    return () => {
      window.removeEventListener("keydown", handleSelectAll);
    };
  }, [paginated]);

  useEffect(() => {
    const pages = Math.ceil(filteredInvalid.length / pageSize) || 1;

    if (currentPage > pages) {
      setCurrentPage(pages);
    }
  }, [filteredInvalid.length, pageSize, currentPage]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <header>
          <div className="logo-wrap">
            <Skeleton circle={true} height={42} width={42} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
          </div>

          <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
            <Skeleton height={22} width={140} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
            <Skeleton height={14} width={100} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Skeleton circle={true} height={28} width={28} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
            <Skeleton height={40} width={40} baseColor="var(--surface)" highlightColor="var(--surface-weak)" style={{ borderRadius: 12 }} />
          </div>
        </header>

        <main>
          <section
            id="controls"
            style={{
              alignItems: "center",
              opacity: 0.95,
            }}
          >
            <div style={{ flex: "1 1 320px", minWidth: 260 }}>
              <Skeleton height={48} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
            </div>

            <Skeleton height={42} width={110} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
            <Skeleton height={42} width={130} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
            <Skeleton height={42} width={120} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
            <Skeleton height={42} width={100} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
            <Skeleton height={42} width={42} baseColor="var(--surface)" highlightColor="var(--surface-weak)" style={{ borderRadius: 12 }} />

            <span className="spacer"></span>

            <div style={{ display: "grid", gap: 8, justifyContent: "flex-end", minWidth: 220 }}>
              <Skeleton height={16} width={180} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
              <div id="pager" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <Skeleton height={42} width={90} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                <Skeleton height={42} width={120} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                <Skeleton height={42} width={90} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
              </div>
            </div>
          </section>

          <section
            id="summary"
            style={{
              marginBottom: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="card"
                style={{
                  minHeight: 118,
                  padding: "18px 16px",
                  display: "grid",
                  gap: 10,
                }}
              >
                <Skeleton height={14} width={90} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                <Skeleton height={34} width={140} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
              </div>
            ))}
          </section>

          <div className="table-wrap" style={{ padding: "6px 0" }}>
            <table id="employees">
              <thead>
                <tr>
                  <th>
                    <Skeleton height={16} width={40} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                  </th>
                  <th>
                    <Skeleton height={16} width={140} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                  </th>
                  <th>
                    <Skeleton height={16} width={100} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                  </th>
                  <th className="num">
                    <Skeleton height={16} width={90} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                  </th>
                  <th className="num">
                    <Skeleton height={16} width={60} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                  </th>
                  <th className="num">
                    <Skeleton height={16} width={80} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                  </th>
                  <th className="num">
                    <Skeleton height={16} width={100} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                  </th>
                  <th className="num">
                    <Skeleton height={16} width={80} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                  </th>
                  <th>
                    <Skeleton height={16} width={40} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>
                      <Skeleton height={16} width={36} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                    </td>
                    <td>
                      <Skeleton height={16} width={140} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                    </td>
                    <td>
                      <Skeleton height={16} width={100} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                    </td>
                    <td className="num">
                      <Skeleton height={16} width={90} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                    </td>
                    <td className="num">
                      <Skeleton height={16} width={60} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                    </td>
                    <td className="num">
                      <Skeleton height={16} width={80} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                    </td>
                    <td className="num">
                      <Skeleton height={16} width={100} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                    </td>
                    <td className="num">
                      <Skeleton height={16} width={80} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                    </td>
                    <td>
                      <Skeleton height={16} width={40} baseColor="var(--surface)" highlightColor="var(--surface-weak)" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header>
        <div className="logo-wrap">
          <img
            src={logo}
            alt="TecnoPrism"
            className="brand"
              onClick={() => navigate("/")}   // 👈 ADD THIS
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling &&
                (e.target.nextSibling.style.display = "inline-block");
            }}
          />
        </div>
        <h1 className="header-title">Invalid Data</h1>
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
          role={role}
          onLogout={onLogout}
          onChangePassword={handleChangePassword}
          onAddUser={handleAddUser}
          onSetRole={handleSetRole}
          onDeleteUser={handleDeleteUser}
          onActivityLog={() => navigate("/activity")}
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
            placeholder="Search ID, Name or Department"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <div style={{ position: 'relative' }}>
            <button
  type="button"
  onClick={() => setShowFilters(!showFilters)}
  style={{
    color: "aliceblue",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  }}
>
  Filters
  <svg
    style={{
      transition: "transform 0.2s ease",
      transform: showFilters ? "rotate(180deg)" : "rotate(0deg)"
    }}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M5 7l5 6 5-6" />
  </svg>
</button>
            <FilterDropdown
              isOpen={showFilters}
              onClose={() => setShowFilters(false)}
              departmentFilter={departmentFilter}
              setDepartmentFilter={setDepartmentFilter}
              gradeFilter={gradeFilter}
              setGradeFilter={setGradeFilter}
              pageSize={pageSize}
              setPageSize={setPageSize}
              departments={departments}
              grades={grades}
              showInvalidFilter={true}
              invFilter={invFilter}
              setInvFilter={setInvFilter}
              setCurrentPage={setCurrentPage}
            />
          </div>
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
            id="increment"
            type="button"
            onClick={() => navigate("/")}
            title="View Incremented data"
            style={{ color: "aliceblue" }}
          >
            Increment Details
          </button>
          <button
            id="export"
            type="button"
            onClick={handleExportCSV}
            title="Export Invalid Data to CSV"
            style={{ color: "aliceblue" }}
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={fetchInvalid}
            title="Refresh Data"
            style={{
              color: "aliceblue",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
            {filteredInvalid.length === 0
              ? "No records found"
              : `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(
                  currentPage * pageSize,
                  filteredInvalid.length,
                )} of ${filteredInvalid.length} records`}
          </span>
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
              Page {currentPage} of {totalPages}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <Summary employees={paginated} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
        >
          <EmployeeTable
            employees={paginated}
            searchQuery={searchQuery}
            onSort={handleSort}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            onDelete={handleDelete}
            onContextMenu={handleContextMenu}
            sortKey={sortKey}
            sortOrder={sortOrder}
            showInvalid={true}
            showViewMore={false}
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
        isOpen={modal.isOpen || showWeights}
        title={modal.title}
        onClose={() => {
          setShowWeights(false);
          handleCloseModal();
        }}
      >
        {showWeights && (
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
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

        {modal.content && <div style={{ padding: 12 }}>{modal.content}</div>}
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
                <tr>
                  <th>Current Salary</th>
                  <td>{formatINR(modal.details.currentsalary)}</td>
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

        {modal.form && modal.form.type === "edit-employee" && (
          <EditEmployeeForm
            data={modal.form.data}
            isInvalid={modal.form.isInvalid}
            onClose={handleCloseModal}
          />
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
{modal.form && modal.form.type === "change-password" && (
  <PasswordResetForm
    username={user}
    onSuccess={handleCloseModal}
    onCancel={handleCloseModal}
  />
)}

{modal.form && modal.form.type === "delete-user" && (
  <DeleteUserForm
    users={modal.form.users || []}
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

                  const recordsToDelete = invalidData.filter((item) =>
                    idsToDelete.includes(item.id),
                  );

                  // 1️⃣ Remove immediately from UI
                  setInvalidData((prev) =>
                    prev.filter((item) => !idsToDelete.includes(item.id)),
                  );

                  // 2️⃣ Store deleted records temporarily
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
                setInvalidData((prev) => [...deletedBuffer.records, ...prev]);

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
    </div>
  );
}
