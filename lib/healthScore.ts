type HealthInput = {
  logins_last_30_days: number;
  support_tickets: number;
  plan_value: number;
  feature_usage_score?: number;
  monthly_logins?: number;
  active_users?: number;
  csat?: number;
  nps?: number;
  last_login_days_ago?: number;
  renewal_date?: string;
};

export function calculateHealth(row: HealthInput) {
    let score = 0;
  
    score += Math.min(row.logins_last_30_days * 2, 40);
    score -= Math.min(row.support_tickets * 5, 30);
    score += Math.min(row.plan_value / 50, 30);
  
    return Math.max(Math.min(score, 100), 0);
  }
  
export function riskFlag(score: number, _row?: HealthInput) {
  if (score < 40) return "High Risk";
  if (score < 70) return "Medium Risk";
  return "Low Risk";

}

export function healthCategory(score: number) {
  if (score >= 75) return "Healthy" as const;
  if (score >= 50) return "Neutral" as const;
  return "At Risk" as const;
}

export function expansionScore(row: HealthInput) {
  const feature = row.feature_usage_score ?? Math.min(row.logins_last_30_days * 2, 100);
  const csat = row.csat ?? 7;
  const nps = row.nps ?? 25;
  const activeUsers = row.active_users ?? Math.max(5, Math.round((row.monthly_logins ?? row.logins_last_30_days) / 2));
  const supportPenalty = Math.min(row.support_tickets * 6, 30);

  const score =
    feature * 0.4 +
    Math.min(activeUsers, 100) * 0.15 +
    csat * 6 * 0.2 +
    Math.max(Math.min(nps + 20, 100), 0) * 0.25 -
    supportPenalty;

  return Math.max(0, Math.min(100, Math.round(score)));
}
