import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [displayCount, setDisplayCount] = useState(0);
const [displayLabel, setDisplayLabel] = useState("events");
const [blinkButton, setBlinkButton] = useState(false);
const [notAuthorized, setNotAuthorized] = useState(false);
const [loading, setLoading] = useState(true);

 const handleFilterToggle = () => {
  if (filter === "all") {
    setFilter("add_employee");
    setDisplayCount(addCount);
    setDisplayLabel("add_employee");
  } 
  else if (filter === "add_employee") {
    setFilter("update_employee");
    setDisplayCount(updateCount);
    setDisplayLabel("update_employee");
  } 
  else if (filter === "update_employee") {
    setFilter("delete_employee");
    setDisplayCount(deleteCount);
    setDisplayLabel("delete_employee");
  } 
  else {
    setFilter("all");
    setDisplayCount(logs.length);
    setDisplayLabel("events");
  }

  // blink on manual click
  setBlinkButton(true);
  setTimeout(() => setBlinkButton(false), 400);
};

useEffect(() => {
  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/activitylog", {
        headers: {
          "x-user": localStorage.getItem("user"),
        },
      });

      if (res.status === 401 || res.status === 403) {
        setNotAuthorized(true);
        return;
      }

      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  fetchLogs();
}, []);
  const getActionStyle = (action) => {
    if (action.includes("delete")) {
      return { background: "#dc262620", color: "#ef4444" };
    }
    if (action.includes("update")) {
      return { background: "#2563eb20", color: "#3b82f6" };
    }
    if (action.includes("add")) {
      return { background: "#16a34a20", color: "#22c55e" };
    }
    return { background: "#6b728020", color: "#9ca3af" };
  };

  function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return `${diff} sec ago`;

    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} min ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return `${days} days ago`;
  }
  const filteredLogs =
    filter === "all" ? logs : logs.filter((log) => log.action === filter);
    const addCount = logs.filter(l => l.action === "add_employee").length;
const updateCount = logs.filter(l => l.action === "update_employee").length;
const deleteCount = logs.filter(l => l.action === "delete_employee").length;
const animateCount = (target, label) => {
  let current = 0;

  setDisplayLabel(label);

  // trigger blink
  setBlinkButton(true);
  setTimeout(() => setBlinkButton(false), 500);

  const interval = setInterval(() => {
    current += Math.ceil(target / 6);

    if (current >= target) {
      current = target;
      clearInterval(interval);
    }

    setDisplayCount(current);
  }, 40);

  return interval;
};

useEffect(() => {
  if (!logs.length) return;

  setDisplayCount(logs.length);
  setDisplayLabel("events");

const intervals = [];

const start = setTimeout(() => {
    intervals.push(animateCount(addCount, "add_employee"));

    setTimeout(() => {
      intervals.push(animateCount(updateCount, "update_employee"));
    }, 1200);

    setTimeout(() => {
      intervals.push(animateCount(deleteCount, "delete_employee"));
    }, 2400);

    setTimeout(() => {
      intervals.push(animateCount(logs.length, "events"));
    }, 3600);

  }, 3000);

return () => {
  clearTimeout(start);
  intervals.forEach(clearInterval);
};
}, [logs]);
const labelColor =
  displayLabel === "add_employee"
    ? "#22c55e"
    : displayLabel === "update_employee"
    ? "#3b82f6"
    : displayLabel === "delete_employee"
    ? "#ef4444"
    : "var(--fg)";
if (notAuthorized) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--fg)"
      }}
    >
      <h1 style={{ fontSize: 40 }}>🚫 Access Denied</h1>

      <p style={{ marginTop: 10, color: "var(--muted)" }}>
        Only administrators can view the activity log.
      </p>

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: 20,
          padding: "10px 18px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          cursor: "pointer"
        }}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}

if (loading) {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 2
      }}
    >
      <CircularProgress size={60} sx={{ color: "var(--fg)" }} />
<span style={{ color: "var(--muted)" }}>
  Loading activity log...
</span>
    </Box>
  );
}
  return (
<div className="activity-log-page">
    <div style={{ padding: 30 }}>
      {
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              height: "var(--control-h)",
              padding: "0 14px",
              background: "var(--surface)",
              color: "var(--fg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.06), 0 3px 10px rgba(0,0,0,0.25)",
              transition: "all .18s ease",
            }}
          >
            ← Dashboard
          </button>
          <h2 className="header-title">Activity Log</h2>

         <span
  onClick={handleFilterToggle}
  style={{
    height: "var(--control-h)",
    padding: "0 14px",
    background: "var(--surface)",
    color: labelColor,
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
boxShadow: blinkButton
  ? "0 0 8px rgba(99,102,241,0.5)"
  : "inset 0 1px 0 rgba(255,255,255,0.06), 0 3px 10px rgba(0,0,0,0.25)",
    animation: blinkButton ? "buttonBlink 0.6s ease-in-out 3" : "none",
  }}
>
            {displayCount} {displayLabel}
          </span>
        </div>
      }
      {/* Table Card */}
      <div
        style={{
          background: "var(--card)",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--table-header)",
              }}
            >
              <th style={th}>Time</th>
              <th style={th}>User</th>
              <th style={th}>Action</th>
              <th style={th}>Target</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: "center",
                    padding: 30,
                    color: "var(--muted)",
                  }}
                >
                  No activity recorded
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} style={row}>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>
                      {timeAgo(log.created_at)}
                    </div>

                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {new Date(log.created_at).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </td>

                  <td style={{ ...td, fontWeight: 500 }}>{log.actor}</td>

                  <td style={td}>
                    <span
                      style={{
                        ...badge,
                        ...getActionStyle(log.action),
                      }}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td style={td}>{log.target}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
  
}

const th = {
  textAlign: "left",
  padding: "12px",
  fontWeight: 600,
};

const td = {
  padding: "12px",
  borderTop: "1px solid var(--border)",
};

const row = {
  transition: "background 0.2s",
};

const badge = {
  padding: "4px 10px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
};

export default ActivityLogPage;
