export const ROLE_PERMISSIONS = {
  admin: new Set([
    "dashboard.view",
    "customers.view", "customers.manage", "customers.delete",
    "vehicles.view", "vehicles.manage", "vehicles.delete",
    "jobs.view", "jobs.create", "jobs.manage", "jobs.status", "jobs.delete", "jobs.parts",
    "inventory.view", "inventory.manage",
    "invoices.view", "invoices.create", "invoices.delete",
    "payments.view", "payments.create",
    "users.manage", "audit.view", "reports.view", "settings.view",
  ]),
  manager: new Set([
    "dashboard.view",
    "customers.view", "customers.manage", "customers.delete",
    "vehicles.view", "vehicles.manage", "vehicles.delete",
    "jobs.view", "jobs.create", "jobs.manage", "jobs.status", "jobs.delete", "jobs.parts",
    "inventory.view", "inventory.manage",
    "invoices.view", "invoices.create", "invoices.delete",
    "payments.view", "payments.create",
    "audit.view", "reports.view", "settings.view",
  ]),
  receptionist: new Set([
    "customers.view", "customers.manage",
    "vehicles.view", "vehicles.manage",
    "jobs.view", "jobs.create", "jobs.manage",
    "invoices.view", "invoices.create",
    "payments.view", "payments.create",
    "settings.view",
  ]),
  mechanic: new Set([
    "customers.view", "vehicles.view",
    "jobs.view", "jobs.manage", "jobs.status", "jobs.parts",
    "inventory.view",
    "settings.view",
  ]),
};

export const can = (role, permission) =>
  Boolean(ROLE_PERMISSIONS[role]?.has(permission));
