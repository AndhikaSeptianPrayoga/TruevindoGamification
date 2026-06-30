export interface AdminLoginPayload {
  email: string
  password: string
}

const DEMO_ADMIN_EMAIL = 'admin@truevindo.games'
const DEMO_ADMIN_PASSWORD = 'demo-password'

export class AuthService {
  login(payload: AdminLoginPayload) {
    if (
      payload.email.trim().toLowerCase() !== DEMO_ADMIN_EMAIL ||
      payload.password !== DEMO_ADMIN_PASSWORD
    ) {
      return null
    }

    return {
      accessToken: 'demo-admin-token',
      user: {
        id: 'admin-1',
        fullName: 'Game Master Truevindo',
        email: DEMO_ADMIN_EMAIL,
        role: 'admin',
      },
    }
  }
}

export const authService = new AuthService()
