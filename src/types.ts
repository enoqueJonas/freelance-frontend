/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'employer' | 'worker' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_verified: boolean;
  date_joined: string;
}

export interface WorkerProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  bio: string;
  skills: string[];
  githubLink?: string;
  portfolioLink?: string;
  experienceYears: number;
  completedJobs: number;
  averageRating: number;
  documentStatus: 'unsubmitted' | 'pending' | 'approved' | 'rejected';
  documentUrl?: string;
  location: string;
}

export interface EmployerProfile {
  id: number;
  userId: number;
  companyName: string;
  contactName: string;
  email: string;
  description: string;
  location: string;
  website?: string;
  industry: string;
  documentStatus: 'unsubmitted' | 'pending' | 'approved' | 'rejected';
  documentUrl?: string;
}

export type OfferStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'disputed';

export interface Offer {
  id: number;
  employerId: number;
  employerProfile: EmployerProfile;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  salaryBudget: number;
  location: string;
  status: OfferStatus;
  createdAt: string;
}

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Proposal {
  id: number;
  offerId: number;
  offerTitle: string;
  employerId: number;
  workerId: number;
  workerProfile: WorkerProfile;
  description: string;
  priceProposal: number;
  timelineDays: number;
  status: ProposalStatus;
  createdAt: string;
}

export type ContractStatus = 'pending' | 'active' | 'completed' | 'disputed';

export interface Contract {
  id: number;
  proposalId: number;
  offerId: number;
  employerId: number;
  workerId: number;
  employerProfile: EmployerProfile;
  workerProfile: WorkerProfile;
  title: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  createdAt: string;
  signedByWorker: boolean;
  signedByEmployer: boolean;
}

export interface Payment {
  id: number;
  contractId: number;
  amount: number;
  payoutMethod: 'M-Pesa' | 'e-Mola' | 'Transferência Bancária';
  status: 'pending' | 'completed' | 'failed';
  refCode: string;
  createdAt: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  text: string;
  isRead: boolean;
  createdAt: string;
  type: 'offer' | 'proposal' | 'contract' | 'payment' | 'message' | 'system' | 'verification';
}

export interface Review {
  id: number;
  contractId: number;
  authorId: number;
  authorName: string;
  targetId: number;
  score: number;
  comment: string;
  createdAt: string;
}
