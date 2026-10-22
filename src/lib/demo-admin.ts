import type { AdminUser } from './types';
// Built-in test accounts, not a simulated live registration database.
export const demoAdminUsers: AdminUser[] = [
  {
    id: 'demo-admin',
    name: 'Demo Admin',
    email: 'admin@linkcraft.test',
    emailVerified: true,
    registeredAt: 0,
    role: 'super_admin'
  },
  {
    id: 'demo-member',
    name: 'Demo Creator',
    email: 'demo@linkcraft.test',
    emailVerified: true,
    registeredAt: 0,
    role: 'member'
  }
];
