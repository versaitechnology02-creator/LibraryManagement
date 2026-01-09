/**
 * Client-side auth utility
 * Checks authentication by calling backend API
 */

export interface User {
  id: string
  email: string
  name: string
  role: "Admin" | "Staff" | "Student"
}

export interface Session {
  user: User
}

/**
 * Check if user is authenticated by calling backend
 * Returns session or null
 */
export async function getSessionClient(): Promise<Session | null> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    const response = await fetch(`${API_URL}/api/profile/me`, {
      credentials: "include",
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    // Transform backend response to session format
    if (!data.user) {
      return null
    }

    return {
      user: {
        id: String(data.user.id || data.user._id || ""),
        email: data.user.email || "",
        name: data.user.name || "",
        role: data.role,
      },
    }
  } catch {
    return null
  }
}

