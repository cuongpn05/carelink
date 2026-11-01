export type CareServiceCategory =
  | 'elderly-care'
  | 'child-care'
  | 'home-care'
  | 'post-treatment-care';

export type CareRequestStatus =
  | 'OPEN'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type CareFrequency = 'ONE_TIME' | 'DAILY' | 'WEEKDAYS' | 'WEEKLY';

export interface CareRecipient {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  relationship: string;
  conditionNotes?: string;
}

export interface CareLocation {
  address: string;
  area: string;
  city?: string;
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
  title: string;
  description: string;
  recipient: CareRecipient;
  location: CareLocation;
  schedule: {
    startDate: string;
    endDate?: string | null;
    timeSlot: string;
    dailyHours: number;
    frequency: CareFrequency;
  };
  expectedBudget: number;
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
