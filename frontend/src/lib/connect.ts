// Shared types + helpers for the TyRey Connect AI dashboard (Phase 1).

export type ConnectNumber = {
  id: string;
  e164: string;
  provider: string;
  toll_free: boolean;
  status: string;
  created_at: string;
};

export type Contact = {
  id: string;
  name: string;
  phone_e164: string;
  email: string | null;
  company: string | null;
  tags: string[];
  sms_opt_out: boolean;
  source: string;
  created_at: string;
};

export type Message = {
  id: string;
  direction: "in" | "out";
  body: string;
  media: string[];
  author: "contact" | "user" | "ai";
  provider_sid: string | null;
  status: string;
  error: string | null;
  segments: number;
  created_at: string;
};

export type Conversation = {
  id: string;
  contact: Contact;
  channel: string;
  status: "open" | "pending" | "closed";
  assigned_to: string | null;
  ai_enabled: boolean;
  last_message_at: string;
  ai_summary: string | null;
  created_at: string;
  last_message_preview?: string;
  messages?: Message[];
};

export type UsageSummary = {
  period_start: string;
  period_end: string;
  items: { kind: string; quantity: number; cost_cents: number }[];
  total_cost_cents: number;
};

export type ConnectProfile = {
  business_name: string;
  business_profile: string;
  ai_auto_reply: boolean;
  updated_at: string;
};

export const USAGE_LABELS: Record<string, string> = {
  sms_out: "SMS sent",
  sms_in: "SMS received",
  mms_out: "MMS sent",
  mms_in: "MMS received",
};

export function formatPhone(e164: string): string {
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function isDemo(numbers: ConnectNumber[]): boolean {
  return numbers.length > 0 && numbers.every((n) => n.provider === "demo");
}
