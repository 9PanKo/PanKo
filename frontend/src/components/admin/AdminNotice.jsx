/** PanKo — Inline success/error banner for admin actions. */
export default function AdminNotice({ type = 'success', message, onDismiss }) {
  if (!message) return null;

  return (
    <div className={`admin-notice admin-notice--${type}`} role="status">
      <span>{message}</span>
      {onDismiss && (
        <button type="button" className="admin-notice__dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
