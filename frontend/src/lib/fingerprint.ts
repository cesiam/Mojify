const STORAGE_KEY = "mojify_user_fingerprint"

export function getUserFingerprint(): string {
  let fp = localStorage.getItem(STORAGE_KEY)
  if (!fp) {
    fp = crypto.randomUUID?.() ?? `fp_${Date.now()}_${Math.random().toString(36).slice(2)}`
    localStorage.setItem(STORAGE_KEY, fp)
  }
  return fp
}
