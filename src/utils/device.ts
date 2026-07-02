const STORAGE_KEY = 'truevindo:device-id'

/**
 * Stable per-device identity, persisted in localStorage. Survives page
 * refreshes and re-scans of a QR code, so the server can recognize a returning
 * device and prevent duplicate entries/joins from the same phone or browser.
 */
export function getDeviceId(): string {
  try {
    let id = window.localStorage.getItem(STORAGE_KEY)
    if (!id) {
      const random =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
      id = `device-${random}`
      window.localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    // localStorage unavailable (private mode etc.) — fall back to a per-page id.
    return `device-session-${Math.random().toString(36).slice(2, 12)}`
  }
}
