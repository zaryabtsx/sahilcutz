// Simple authentication utility - replace with real backend auth in production
export const ADMIN_CREDENTIALS = {
  email: 'admin@sahilcutzz.com',
  password: 'admin123',
};

export function validateAdminCredentials(email: string, password: string): boolean {
  return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
}

export function setAdminToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminToken', token);
  }
}

export function getAdminToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminToken');
  }
  return null;
}

export function clearAdminToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminToken');
  }
}

export function isAdminAuthenticated(): boolean {
  const token = getAdminToken();
  return !!token && token === 'admin_verified';
}
