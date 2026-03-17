export function calculateHealth(row: any) {
    let score = 0;
  
    score += Math.min(row.logins_last_30_days * 2, 40);
    score -= Math.min(row.support_tickets * 5, 30);
    score += Math.min(row.plan_value / 50, 30);
  
    return Math.max(Math.min(score, 100), 0);
  }
  
  export function riskFlag(score: number) {
    if (score < 40) return "High Risk";
    if (score < 70) return "Medium Risk";
    return "Low Risk";
  }