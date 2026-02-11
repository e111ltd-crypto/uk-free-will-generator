
export enum MaritalStatus {
  SINGLE = 'Single',
  MARRIED = 'Married',
  CIVIL_PARTNERSHIP = 'Civil Partnership',
  DIVORCED = 'Divorced',
  WIDOWED = 'Widowed'
}

export interface Person {
  fullName: string;
  address: string;
}

export interface Witness extends Person {
  occupation: string;
}

export interface Executor extends Person {}

export interface Child {
  fullName: string;
  dob: string;
}

export interface Beneficiary extends Person {
  percentage: number;
}

export interface DonationRecord {
  id: string;
  amount: number;
  timestamp: number;
  status: 'succeeded' | 'pending' | 'failed';
  email?: string;
}

export interface ConnectAccount {
  id: string;
  displayName: string;
  onboardingComplete: boolean;
  readyToProcessPayments: boolean;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'none';
}

export interface WillData {
  testator: {
    fullName: string;
    address: string;
    dob: string;
    maritalStatus: MaritalStatus;
  };
  spouse?: Person;
  executors: Executor[];
  hasChildren: boolean;
  children: Child[];
  guardians: Person[];
  beneficiaries: Beneficiary[];
  residuaryBeneficiary: string;
  witnesses: Witness[];
  donationAmount: number;
  isPremium: boolean;
  premiumConfig?: {
    fontFamily: 'times' | 'courier' | 'helvetica';
    includeWatermark: boolean;
  };
  signatureData?: string;
  acceptedTerms: boolean;
  generationDate: string;
  // Connect platform fields
  stripeAccountId?: string;
}

export enum WizardStep {
  LANDING = 0,
  ELIGIBILITY = 1,
  PERSONAL_INFO = 2,
  EXECUTORS = 3,
  CHILDREN = 4,
  BENEFICIARIES = 5,
  RESIDUARY = 6,
  REVIEW = 7,
  DONATION = 8,
  WITNESS = 9,
  SIGNATURE = 10,
  COMPLETION = 11
}
