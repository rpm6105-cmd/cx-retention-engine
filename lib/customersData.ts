export type CustomerPlan = "Starter" | "Pro" | "Business";

export type CustomerTask = {
  id: string;
  title: string;
  due: string;
  status: "Open" | "Done";
};

export type CustomerRow = {
  id: string;
  name: string;
  plan: CustomerPlan;
  mrr: number;
  lastActivity: string;

  // Inputs used by calculateHealth(row)
  logins_last_30_days: number;
  support_tickets: number;
  plan_value: number;

  // Optional detail-only fields (still from the same dataset)
  usageTrend?: number[];
  tasks?: CustomerTask[];
};

export const DEFAULT_CUSTOMERS: CustomerRow[] = [
  {
    id: "CUST-1024",
    name: "Acme Co",
    plan: "Pro",
    mrr: 1299,
    lastActivity: "2d ago",
    logins_last_30_days: 22,
    support_tickets: 1,
    plan_value: 1299,
    usageTrend: [62, 64, 66, 67, 70, 73, 72, 74, 78, 80, 81, 83],
    tasks: [
      { id: "T-1", title: "Schedule QBR", due: "Fri", status: "Open" },
      { id: "T-2", title: "Share adoption playbook", due: "Mon", status: "Open" },
      { id: "T-3", title: "Review ticket themes", due: "Wed", status: "Done" },
    ],
  },
  {
    id: "CUST-1025",
    name: "Northwind",
    plan: "Business",
    mrr: 2499,
    lastActivity: "9d ago",
    logins_last_30_days: 8,
    support_tickets: 7,
    plan_value: 2499,
    usageTrend: [74, 72, 69, 65, 60, 56, 52, 49, 47, 45, 44, 42],
    tasks: [
      {
        id: "T-4",
        title: "Escalation review with Support",
        due: "Today",
        status: "Open",
      },
      { id: "T-5", title: "Executive sponsor outreach", due: "Thu", status: "Open" },
      { id: "T-6", title: "Renewal risk assessment", due: "Next week", status: "Open" },
    ],
  },
  {
    id: "CUST-1026",
    name: "Globex",
    plan: "Starter",
    mrr: 399,
    lastActivity: "1d ago",
    logins_last_30_days: 16,
    support_tickets: 0,
    plan_value: 399,
    usageTrend: [55, 57, 60, 62, 61, 64, 66, 68, 67, 70, 72, 71],
    tasks: [
      { id: "T-7", title: "Intro call", due: "Fri", status: "Open" },
      { id: "T-8", title: "Send onboarding checklist", due: "Mon", status: "Open" },
      { id: "T-9", title: "Confirm success criteria", due: "Wed", status: "Open" },
    ],
  },
  {
    id: "CUST-1027",
    name: "Initech",
    plan: "Pro",
    mrr: 1499,
    lastActivity: "6d ago",
    logins_last_30_days: 11,
    support_tickets: 3,
    plan_value: 1499,
    usageTrend: [68, 67, 66, 64, 62, 60, 58, 57, 56, 54, 53, 52],
    tasks: [
      { id: "T-10", title: "Run adoption workshop", due: "Mon", status: "Open" },
      { id: "T-11", title: "Review onboarding checklist", due: "Wed", status: "Open" },
      { id: "T-12", title: "Share QBR deck", due: "Fri", status: "Done" },
    ],
  },
  {
    id: "CUST-1028",
    name: "Umbrella",
    plan: "Business",
    mrr: 3299,
    lastActivity: "Today",
    logins_last_30_days: 28,
    support_tickets: 0,
    plan_value: 3299,
    usageTrend: [70, 72, 74, 76, 78, 80, 82, 83, 85, 87, 88, 90],
    tasks: [
      { id: "T-13", title: "Plan expansion discussion", due: "Thu", status: "Open" },
      { id: "T-14", title: "Send quarterly product update", due: "Next week", status: "Open" },
    ],
  },
  {
    id: "CUST-1029",
    name: "Wayne Enterprises",
    plan: "Pro",
    mrr: 1899,
    lastActivity: "3d ago",
    logins_last_30_days: 19,
    support_tickets: 1,
    plan_value: 1899,
    usageTrend: [60, 61, 63, 65, 64, 66, 67, 69, 70, 71, 72, 73],
    tasks: [
      { id: "T-15", title: "Confirm success criteria", due: "Wed", status: "Open" },
      { id: "T-16", title: "Share adoption benchmarks", due: "Fri", status: "Open" },
    ],
  },
];

export function getCustomerById(id: string): CustomerRow | undefined {
  return DEFAULT_CUSTOMERS.find((c) => c.id === id);
}

