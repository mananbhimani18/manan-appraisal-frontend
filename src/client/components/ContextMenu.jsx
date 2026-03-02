import React from "react";

export default function ContextMenu({
  visible,
  x,
  y,
  selectedCount,
  onDelete,
  canDelete
}) {
  if (!visible || !canDelete || selectedCount === 0) return null;

  return (
  <div
    className="custom-context-menu"
    style={{
      position: "fixed",
      top: y,
      left: x,
      background: "#1f2937",
      color: "white",
      padding: "8px 0",
      borderRadius: "8px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
      zIndex: 9999,
      minWidth: "200px"
    }}
  >
      <div
        style={{
          padding: "8px 16px",
          cursor: "pointer"
        }}
        onClick={onDelete}
      >
        🗑 Delete Selected ({selectedCount})
      </div>
    </div>
  );
}