// Training & Certification Types

export type CourseStatus = 'draft' | 'published' | 'archived';
export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'expired' | 'failed';
export type CertificationStatus = 'active' | 'expiring_soon' | 'expired' | 'revoked';
export type CourseType = 'online' | 'in_person' | 'hybrid' | 'self_paced';

export interface TrainingCategory {
  id: string;
  name: string;
  description?: string;
  courseCount: number;
  color?: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  type: CourseType;
  status: CourseStatus;
  duration: number; // in minutes
  passingScore?: number; // percentage
  isRequired: boolean;
  requiredForRoles?: string[];
  prerequisites?: string[];
  modules: CourseModule[];
  thumbnailUrl?: string;
  instructorId?: string;
  instructorName?: string;
  maxEnrollments?: number;
  enrollmentCount: number;
  completionCount: number;
  averageScore?: number;
  validityPeriod?: number; // in months, how long certification is valid
  renewalRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'interactive';
  contentUrl?: string;
  duration: number; // in minutes
  isRequired: boolean;
  passingScore?: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  status: EnrollmentStatus;
  progress: number; // percentage
  score?: number;
  startedAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  expiresAt?: Date;
  certificateId?: string;
  moduleProgress: ModuleProgress[];
  attempts: number;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleProgress {
  moduleId: string;
  moduleTitle: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  score?: number;
  completedAt?: Date;
  timeSpent: number; // in seconds
}

export interface Certification {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId?: string;
  courseName?: string;
  name: string;
  description?: string;
  type: 'internal' | 'external' | 'license' | 'credential';
  issuingOrganization?: string;
  certificationNumber?: string;
  status: CertificationStatus;
  issueDate: Date;
  expirationDate?: Date;
  renewalDate?: Date;
  credentialUrl?: string;
  documentUrl?: string;
  verificationUrl?: string;
  skills?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingAssignment {
  id: string;
  courseId: string;
  courseTitle: string;
  assignedTo: 'user' | 'role' | 'facility' | 'all';
  assignedToId?: string;
  assignedToName?: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  totalAssigned: number;
  totalCompleted: number;
  notes?: string;
  assignedBy: string;
  createdAt: Date;
}

export interface TrainingSchedule {
  id: string;
  courseId: string;
  courseTitle: string;
  type: 'in_person' | 'virtual';
  startDate: Date;
  endDate: Date;
  location?: string;
  virtualLink?: string;
  instructorId?: string;
  instructorName?: string;
  maxCapacity: number;
  enrolledCount: number;
  waitlistCount: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

export interface TrainingStats {
  totalCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  averageCompletionRate: number;
  averageScore: number;
  activeCertifications: number;
  expiringSoon: number;
  overdueAssignments: number;
  complianceRate: number;
}

export interface StaffTrainingRecord {
  userId: string;
  userName: string;
  userRole: string;
  facilityId?: string;
  facilityName?: string;
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  overdueCourses: number;
  certifications: number;
  expiringCertifications: number;
  complianceScore: number;
  lastActivityAt?: Date;
}

export interface TrainingFilter {
  categoryId?: string;
  type?: CourseType;
  status?: CourseStatus;
  isRequired?: boolean;
  search?: string;
}

export interface CertificationFilter {
  userId?: string;
  type?: string;
  status?: CertificationStatus;
  expiringSoon?: boolean;
}
