export function validUsername(u) {
  return /^[a-z0-9._-]{3,30}$/.test(u);
}
export const ROLE_KEYS = ['admin', 'clerk', 'viewer'];
