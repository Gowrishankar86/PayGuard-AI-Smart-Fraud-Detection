export type RiskLevel = 'low' | 'medium' | 'high';
export type Decision = 'allow' | 'verify' | 'review';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export interface AssessmentInput {
  amount: number;
  paymentCountry: string;
  deviceType: DeviceType;
  isNewDevice: boolean;
  accountAgeDays: number;
  transactionsLast24h: number;
  localHour: number;
}

export interface RiskFactor {
  id: string;
  label: string;
  points: number;
  detail: string;
}

export interface Assessment {
  score: number;
  level: RiskLevel;
  decision: Decision;
  factors: RiskFactor[];
}

const BASE_SCORE = 8;

function buildFactors(input: AssessmentInput): RiskFactor[] {
  const candidates: (RiskFactor | null)[] = [
    input.amount >= 1000
      ? { id: 'amount', label: 'Large payment amount', points: 28, detail: 'Payments of $1,000 or more carry the highest amount risk.' }
      : input.amount >= 300
        ? { id: 'amount', label: 'Elevated payment amount', points: 12, detail: 'Payments between $300 and $999 are moderately elevated.' }
        : null,
    input.accountAgeDays < 30
      ? { id: 'account_age', label: 'New account', points: 20, detail: 'The account is less than 30 days old.' }
      : input.accountAgeDays < 90
        ? { id: 'account_age', label: 'Young account', points: 10, detail: 'The account is between 30 and 90 days old.' }
        : input.accountAgeDays >= 365
          ? { id: 'account_age', label: 'Established account', points: -6, detail: 'The account has a history of over one year.' }
          : null,
    input.transactionsLast24h >= 10
      ? { id: 'velocity', label: 'Very high transaction velocity', points: 22, detail: `${input.transactionsLast24h} payments in the last 24 hours.` }
      : input.transactionsLast24h >= 5
        ? { id: 'velocity', label: 'High transaction velocity', points: 12, detail: `${input.transactionsLast24h} payments in the last 24 hours.` }
        : null,
    input.isNewDevice
      ? { id: 'new_device', label: 'Unrecognised device', points: 14, detail: 'This payment comes from a device not seen on the account before.' }
      : null,
    input.localHour < 5
      ? { id: 'hour', label: 'Unusual payment hour', points: 8, detail: 'Payments between midnight and 5 AM are less common for this account.' }
      : null,
    input.paymentCountry !== 'US'
      ? { id: 'cross_border', label: 'Cross-border payment', points: 6, detail: 'The payment originates outside the United States.' }
      : null,
  ];

  return candidates
    .filter((factor): factor is RiskFactor => factor !== null)
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
}

export function assessTransaction(input: AssessmentInput): Assessment {
  const factors = buildFactors(input);
  const raw = BASE_SCORE + factors.reduce((sum, factor) => sum + factor.points, 0);
  const score = Math.min(100, Math.max(0, Math.round(raw)));
  const level = levelForScore(score);
  return { score, level, decision: DECISION_BY_LEVEL[level], factors };
}

export function levelForScore(score: number): RiskLevel {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

const DECISION_BY_LEVEL: Record<RiskLevel, Decision> = {
  low: 'allow',
  medium: 'verify',
  high: 'review',
};

export const DECISION_COPY: Record<Decision, { title: string; summary: string }> = {
  allow: {
    title: 'Proceed to payment',
    summary: 'The payment looks consistent with normal activity. You can continue to PayPal checkout.',
  },
  verify: {
    title: 'Additional verification',
    summary: 'A few signals differ from usual activity. Confirm the payment is yours before it is sent.',
  },
  review: {
    title: 'Manual review',
    summary: 'The payment shows several high-risk signals. It has been sent to our review team and will not be charged yet.',
  },
};

export const LEVEL_COPY: Record<RiskLevel, { label: string; range: string }> = {
  low: { label: 'Low risk', range: '0 to 39' },
  medium: { label: 'Medium risk', range: '40 to 69' },
  high: { label: 'High risk', range: '70 to 100' },
};
