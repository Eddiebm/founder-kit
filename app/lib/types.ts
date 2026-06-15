export interface CompanyProfile {
  companyName: string;
  oneLiner: string;
  stage: string;
  focusArea: string;
  geography: string;
  revenueModel: string;
  annualBudget: string;
  isNonprofit: string;
  impactDescription: string;
}

export interface GrantProgram {
  id: string;
  name: string;
  funder: string;
  awardRange: string;
  eligibilitySummary: string;
  focusAreas: string[];
  geographies: string[];
  stages: string[];
  requiresNonprofit: boolean;
  url: string;
}

export interface ScoredGrant extends GrantProgram {
  fitScore: "High" | "Medium" | "Low";
  fitRationale: string;
}
