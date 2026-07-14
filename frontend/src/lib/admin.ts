// Shared types for the admin console (mirrors backend/app/routers/admin.py).

export type AdminMetric = { label: string; value: number };

export type AdminOverview = {
  users_total: number;
  users_by_plan: AdminMetric[];
  mrr_cents: number;
  leads_by_status: AdminMetric[];
  orders_total: number;
  orders_revenue_cents: number;
  connect_active_numbers: number;
  connect_pending_registration: number;
  connect_messages_this_period: number;
};

export type AdminClientRow = {
  id: string;
  email: string;
  plan: string;
  is_admin: boolean;
  has_billing_account: boolean;
  projects: number;
  documents: number;
  orders: number;
  connect_conversations: number;
  created_at: string;
};

export type AdminOrder = {
  id: string;
  email: string | null;
  tier: string;
  amount: number;
  status: string;
  created_at: string;
};

export type AdminNumber = {
  id: string;
  e164: string;
  provider: string;
  toll_free: boolean;
  status: string;
  owner_email: string;
  created_at: string;
};

export type AdminLead = {
  id: string;
  service: string;
  name: string;
  email: string;
  company: string;
  message: string;
  status: string;
  created_at: string;
};

export type AdminClientDetail = {
  id: string;
  email: string;
  plan: string;
  is_admin: boolean;
  stripe_customer_id: string | null;
  created_at: string;
  projects: { id: string; name: string; industry: string; stage: string; created_at: string }[];
  documents: number;
  orders: AdminOrder[];
  leads: AdminLead[];
  connect_numbers: AdminNumber[];
  connect_conversations: number;
  connect_usage_cents_this_period: number;
};

export const PLANS = ["free", "starter", "pro", "executive", "connect", "connect_executive"];
export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"];

export function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function planLabel(plan: string): string {
  return plan.replace("_", " ");
}
