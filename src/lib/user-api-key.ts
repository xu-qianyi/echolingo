const STORAGE_KEY = "echolingo_user_api_key"

export function getUserApiKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEY) || null
}

export function setUserApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key)
}

export function clearUserApiKey() {
  localStorage.removeItem(STORAGE_KEY)
}

export function withUserApiKey(headers: HeadersInit = {}): HeadersInit {
  const key = getUserApiKey()
  return key ? { ...headers, "X-User-Api-Key": key } : headers
}
