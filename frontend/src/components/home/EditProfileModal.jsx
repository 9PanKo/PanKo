/** PanKo — Edit display name and change password modal. */
import PasswordInput from '../PasswordInput';

export default function EditProfileModal({
  open,
  editDisplayName,
  setEditDisplayName,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  repeatNewPassword,
  setRepeatNewPassword,
  saving,
  editError,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit profile">
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">Edit profile</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal__body">
            {editError && <p className="login-error">{editError}</p>}

            <div className="form-group">
              <label htmlFor="edit-display-name">Username</label>
              <input
                id="edit-display-name"
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Your username"
                required
              />
            </div>

            <h3 className="profile-subtitle">Change password</h3>
            <PasswordInput
              id="edit-old-password"
              label="Old password"
              value={oldPassword}
              onChange={setOldPassword}
              placeholder="Old password"
            />
            <PasswordInput
              id="edit-new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="New password"
            />
            <PasswordInput
              id="edit-repeat-new-password"
              label="Repeat new password"
              value={repeatNewPassword}
              onChange={setRepeatNewPassword}
              placeholder="Repeat new password"
            />
          </div>

          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
