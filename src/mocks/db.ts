/**
 * In-memory data behind the mock API. PLACEHOLDER DATA: every name and email
 * is generated and fictional. Changes last until the app reloads.
 *
 * These types describe the backend's records on purpose: the app never
 * imports them, it validates responses with its own Zod schemas, exactly as
 * it would against a real API.
 */
export type MockRole = 'admin' | 'editor' | 'viewer';
export type MockStatus = 'active' | 'invited' | 'suspended';

export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: MockRole;
  status: MockStatus;
  createdAt: string;
  lastActiveAt: string | null;
};

export const DEMO_CREDENTIALS = { email: 'demo@example.com', password: 'password123' };

const firstNames = ['Ava', 'Liam', 'Mia', 'Noah', 'Zoe', 'Ethan', 'Ivy', 'Lucas', 'Nora', 'Owen'];
const lastNames = ['Turner', 'Brooks', 'Hayes', 'Price', 'Bennett', 'Foster', 'Reed', 'Coleman'];
const roles: MockRole[] = ['viewer', 'editor', 'viewer', 'admin', 'viewer', 'editor'];
const statuses: MockStatus[] = ['active', 'active', 'active', 'invited', 'active', 'suspended'];
const DAY = 86_400_000;

function seed(now = Date.now()): MockUser[] {
  const demo: MockUser = {
    id: 'usr_0001',
    name: 'Demo Admin',
    email: DEMO_CREDENTIALS.email,
    role: 'admin',
    status: 'active',
    createdAt: new Date(now - 200 * DAY).toISOString(),
    lastActiveAt: new Date(now).toISOString(),
  };
  const others = Array.from({ length: 47 }, (_, index): MockUser => {
    const first = firstNames[(index * 7) % firstNames.length] ?? 'Alex';
    const last = lastNames[(index * 5) % lastNames.length] ?? 'Doe';
    const status = statuses[index % statuses.length] ?? 'active';
    return {
      id: `usr_${String(index + 2).padStart(4, '0')}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${index + 2}@example.com`.toLowerCase(),
      role: roles[index % roles.length] ?? 'viewer',
      status,
      createdAt: new Date(now - (index * 3.7 + 1) * DAY).toISOString(),
      lastActiveAt: status === 'invited' ? null : new Date(now - (index % 9) * DAY).toISOString(),
    };
  });
  return [demo, ...others];
}

export const db = { users: seed() };

/** Restores the seed data. Called between tests so they don't affect each other. */
export function resetDb() {
  db.users = seed();
}
