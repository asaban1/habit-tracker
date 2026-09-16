export default function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card modal-card-small" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p style={{ marginTop: 10, color: "var(--color-ink-soft)" }}>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} style={{ width: "auto" }}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
            style={{ width: "auto" }}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}