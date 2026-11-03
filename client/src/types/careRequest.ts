export type CareServiceCategory =
  | 'elderly-care'
  | 'child-care'
  | 'home-care'
  | 'post-treatment-care';

export type CareRequestStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type CareFrequency = 'ONE_TIME' | 'DAILY' | 'WEEKDAYS' | 'WEEKLY';

export type CareBudgetUnit = 'PER_DAY' | 'PER_HOUR' | 'PER_MONTH' | 'TOTAL';

export interface CareRecipient {
  age: number;
  name?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  relationship?: string;
  conditionNotes?: string;
}

export interface CareLocation {
  area: string;
  city?: string;
  address?: string;
}

export interface CareSchedule {
  startDate: string;
  endDate?: string | null;
  timeSlot: string;
  dailyHours: number;
  frequency: CareFrequency;
}

export interface CustomerSummary {
  accountId: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  reputationScore?: number;
}

export interface CaregiverSummary {
  accountId: string;
  profileId?: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  ratingAvg?: number;
  totalReviews?: number;
  experienceYears?: number;
  bio?: string;
  reputationScore?: number;
}

export interface CareRequestItem {
  _id: string;
  customerId: string;
  serviceCategory: CareServiceCategory;
  title: string;
  description: string;
  recipient: CareRecipient;
  location: CareLocation;
  schedule: CareSchedule;
  expectedBudget: number;
  budgetUnit?: CareBudgetUnit;
  specialRequirements: string[];
  status: CareRequestStatus;
  acceptedCaregiverId?: string | null;
  acceptedCaregiverProfileId?: string | null;
  acceptedAt?: string | null;
  cancellationReason?: string;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: CustomerSummary;
  acceptedCaregiver?: CaregiverSummary | null;
}

export interface CreateCareRequestDto {
  serviceCategory: CareServiceCategory;
  title?: string;
  description: string;
  recipient: {
    age: number;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    name?: string;
    relationship?: string;
    conditionNotes?: string;
  };
  location: {
    area: string;
    city?: string;
    address?: string;
  };
  schedule: {
    startDate: string;
    endDate?: string | null;
    timeSlot: string;
    dailyHours: number;
    frequency: CareFrequency;
  };
  expectedBudget: number;
  budgetUnit?: CareBudgetUnit;
  specialRequirements?: string[];
}

export interface CareRequestStats {
  ALL: number;
  OPEN: number;
  ACCEPTED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  CANCELLED: number;
}

export interface CareRequestNotification {
  requestId: string;
  title: string;
  message: string;
  acceptedAt: string;
  isRead: boolean;
  caregiver?: CaregiverSummary | null;
}
