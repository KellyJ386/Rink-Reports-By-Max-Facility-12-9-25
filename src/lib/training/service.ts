// Training & Certification Service

import type {
  TrainingCourse,
  TrainingCategory,
  Enrollment,
  Certification,
  TrainingAssignment,
  TrainingSchedule,
  TrainingStats,
  StaffTrainingRecord,
  TrainingFilter,
  CertificationFilter,
  CourseType,
  CourseStatus,
  EnrollmentStatus,
  CertificationStatus,
} from './types';

// Get training categories
export async function getTrainingCategories(): Promise<TrainingCategory[]> {
  return [
    { id: 'cat-safety', name: 'Safety & Compliance', courseCount: 12, color: 'red' },
    { id: 'cat-operations', name: 'Operations', courseCount: 8, color: 'blue' },
    { id: 'cat-customer', name: 'Customer Service', courseCount: 6, color: 'green' },
    { id: 'cat-equipment', name: 'Equipment Operation', courseCount: 5, color: 'yellow' },
    { id: 'cat-management', name: 'Management', courseCount: 4, color: 'purple' },
    { id: 'cat-emergency', name: 'Emergency Response', courseCount: 7, color: 'orange' },
  ];
}

// Get training courses
export async function getTrainingCourses(filter?: TrainingFilter): Promise<TrainingCourse[]> {
  const courses: TrainingCourse[] = [
    {
      id: 'course-1',
      title: 'Ice Rink Safety Fundamentals',
      description: 'Essential safety protocols and procedures for all ice rink staff members.',
      categoryId: 'cat-safety',
      categoryName: 'Safety & Compliance',
      type: 'online',
      status: 'published',
      duration: 60,
      passingScore: 80,
      isRequired: true,
      requiredForRoles: ['all'],
      modules: [
        { id: 'm1', title: 'Introduction to Ice Rink Safety', order: 1, type: 'video', duration: 15, isRequired: true },
        { id: 'm2', title: 'Personal Protective Equipment', order: 2, type: 'video', duration: 10, isRequired: true },
        { id: 'm3', title: 'Emergency Procedures', order: 3, type: 'document', duration: 15, isRequired: true },
        { id: 'm4', title: 'Safety Assessment Quiz', order: 4, type: 'quiz', duration: 20, isRequired: true, passingScore: 80 },
      ],
      enrollmentCount: 45,
      completionCount: 38,
      averageScore: 87,
      validityPeriod: 12,
      renewalRequired: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: 'course-2',
      title: 'Zamboni Operation Certification',
      description: 'Comprehensive training on Zamboni ice resurfacing machine operation and maintenance.',
      categoryId: 'cat-equipment',
      categoryName: 'Equipment Operation',
      type: 'hybrid',
      status: 'published',
      duration: 240,
      passingScore: 85,
      isRequired: false,
      requiredForRoles: ['Ice Technician', 'Maintenance'],
      modules: [
        { id: 'm1', title: 'Zamboni Components Overview', order: 1, type: 'video', duration: 30, isRequired: true },
        { id: 'm2', title: 'Pre-Operation Inspection', order: 2, type: 'video', duration: 20, isRequired: true },
        { id: 'm3', title: 'Basic Operation', order: 3, type: 'interactive', duration: 60, isRequired: true },
        { id: 'm4', title: 'Advanced Techniques', order: 4, type: 'video', duration: 45, isRequired: true },
        { id: 'm5', title: 'Maintenance Procedures', order: 5, type: 'document', duration: 30, isRequired: true },
        { id: 'm6', title: 'Hands-on Assessment', order: 6, type: 'assignment', duration: 45, isRequired: true, passingScore: 85 },
        { id: 'm7', title: 'Written Exam', order: 7, type: 'quiz', duration: 30, isRequired: true, passingScore: 85 },
      ],
      enrollmentCount: 12,
      completionCount: 8,
      averageScore: 91,
      validityPeriod: 24,
      renewalRequired: true,
      createdAt: new Date('2023-03-20'),
      updatedAt: new Date('2023-11-15'),
    },
    {
      id: 'course-3',
      title: 'First Aid & CPR/AED',
      description: 'American Red Cross certified first aid and CPR/AED training.',
      categoryId: 'cat-emergency',
      categoryName: 'Emergency Response',
      type: 'in_person',
      status: 'published',
      duration: 480,
      passingScore: 80,
      isRequired: true,
      requiredForRoles: ['Manager', 'Supervisor', 'Lifeguard'],
      modules: [
        { id: 'm1', title: 'First Aid Basics', order: 1, type: 'video', duration: 60, isRequired: true },
        { id: 'm2', title: 'CPR Techniques', order: 2, type: 'video', duration: 90, isRequired: true },
        { id: 'm3', title: 'AED Operation', order: 3, type: 'video', duration: 45, isRequired: true },
        { id: 'm4', title: 'Practical Skills Assessment', order: 4, type: 'assignment', duration: 180, isRequired: true, passingScore: 80 },
        { id: 'm5', title: 'Written Certification Exam', order: 5, type: 'quiz', duration: 45, isRequired: true, passingScore: 80 },
      ],
      instructorName: 'Red Cross Certified Instructor',
      enrollmentCount: 28,
      completionCount: 24,
      averageScore: 89,
      validityPeriod: 24,
      renewalRequired: true,
      createdAt: new Date('2023-02-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'course-4',
      title: 'Customer Service Excellence',
      description: 'Training on providing exceptional customer experiences at ice facilities.',
      categoryId: 'cat-customer',
      categoryName: 'Customer Service',
      type: 'self_paced',
      status: 'published',
      duration: 90,
      passingScore: 75,
      isRequired: true,
      requiredForRoles: ['Front Desk', 'Customer Service'],
      modules: [
        { id: 'm1', title: 'Customer Service Fundamentals', order: 1, type: 'video', duration: 20, isRequired: true },
        { id: 'm2', title: 'Handling Difficult Situations', order: 2, type: 'video', duration: 25, isRequired: true },
        { id: 'm3', title: 'Communication Skills', order: 3, type: 'interactive', duration: 30, isRequired: true },
        { id: 'm4', title: 'Assessment', order: 4, type: 'quiz', duration: 15, isRequired: true, passingScore: 75 },
      ],
      enrollmentCount: 35,
      completionCount: 30,
      averageScore: 85,
      validityPeriod: 0,
      renewalRequired: false,
      createdAt: new Date('2023-05-10'),
      updatedAt: new Date('2023-09-20'),
    },
  ];

  let filtered = courses;
  if (filter?.categoryId) {
    filtered = filtered.filter((c) => c.categoryId === filter.categoryId);
  }
  if (filter?.type) {
    filtered = filtered.filter((c) => c.type === filter.type);
  }
  if (filter?.status) {
    filtered = filtered.filter((c) => c.status === filter.status);
  }
  if (filter?.isRequired !== undefined) {
    filtered = filtered.filter((c) => c.isRequired === filter.isRequired);
  }
  if (filter?.search) {
    const search = filter.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search)
    );
  }

  return filtered;
}

// Get enrollments
export async function getEnrollments(userId?: string): Promise<Enrollment[]> {
  const now = new Date();

  return [
    {
      id: 'enroll-1',
      userId: userId || 'user-1',
      userName: 'John Smith',
      userEmail: 'john@example.com',
      courseId: 'course-1',
      courseTitle: 'Ice Rink Safety Fundamentals',
      status: 'in_progress',
      progress: 65,
      startedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      moduleProgress: [
        { moduleId: 'm1', moduleTitle: 'Introduction to Ice Rink Safety', status: 'completed', progress: 100, completedAt: new Date(), timeSpent: 920 },
        { moduleId: 'm2', moduleTitle: 'Personal Protective Equipment', status: 'completed', progress: 100, completedAt: new Date(), timeSpent: 650 },
        { moduleId: 'm3', moduleTitle: 'Emergency Procedures', status: 'in_progress', progress: 60, timeSpent: 540 },
        { moduleId: 'm4', moduleTitle: 'Safety Assessment Quiz', status: 'not_started', progress: 0, timeSpent: 0 },
      ],
      attempts: 1,
      lastAccessedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    },
    {
      id: 'enroll-2',
      userId: userId || 'user-1',
      userName: 'John Smith',
      userEmail: 'john@example.com',
      courseId: 'course-4',
      courseTitle: 'Customer Service Excellence',
      status: 'completed',
      progress: 100,
      score: 88,
      startedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      certificateId: 'cert-1',
      moduleProgress: [
        { moduleId: 'm1', moduleTitle: 'Customer Service Fundamentals', status: 'completed', progress: 100, score: 100, completedAt: new Date(), timeSpent: 1250 },
        { moduleId: 'm2', moduleTitle: 'Handling Difficult Situations', status: 'completed', progress: 100, score: 100, completedAt: new Date(), timeSpent: 1580 },
        { moduleId: 'm3', moduleTitle: 'Communication Skills', status: 'completed', progress: 100, score: 90, completedAt: new Date(), timeSpent: 1820 },
        { moduleId: 'm4', moduleTitle: 'Assessment', status: 'completed', progress: 100, score: 88, completedAt: new Date(), timeSpent: 850 },
      ],
      attempts: 1,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
    },
  ];
}

// Get certifications
export async function getCertifications(filter?: CertificationFilter): Promise<Certification[]> {
  const now = new Date();

  const certifications: Certification[] = [
    {
      id: 'cert-1',
      userId: 'user-1',
      userName: 'John Smith',
      userEmail: 'john@example.com',
      courseId: 'course-4',
      courseName: 'Customer Service Excellence',
      name: 'Customer Service Excellence Certificate',
      type: 'internal',
      status: 'active',
      issueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      skills: ['Customer Communication', 'Conflict Resolution', 'Service Excellence'],
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'cert-2',
      userId: 'user-1',
      userName: 'John Smith',
      userEmail: 'john@example.com',
      courseId: 'course-3',
      courseName: 'First Aid & CPR/AED',
      name: 'First Aid/CPR/AED Certification',
      type: 'external',
      issuingOrganization: 'American Red Cross',
      certificationNumber: 'ARC-2024-123456',
      status: 'active',
      issueDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      expirationDate: new Date(now.getTime() + 640 * 24 * 60 * 60 * 1000),
      verificationUrl: 'https://redcross.org/verify/123456',
      skills: ['First Aid', 'CPR', 'AED Operation'],
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'cert-3',
      userId: 'user-2',
      userName: 'Jane Doe',
      userEmail: 'jane@example.com',
      name: 'Zamboni Operator License',
      type: 'license',
      certificationNumber: 'ZOL-MN-2024-789',
      status: 'expiring_soon',
      issueDate: new Date(now.getTime() - 700 * 24 * 60 * 60 * 1000),
      expirationDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      renewalDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      skills: ['Ice Resurfacing', 'Equipment Maintenance'],
      createdAt: new Date(now.getTime() - 700 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    },
    {
      id: 'cert-4',
      userId: 'user-3',
      userName: 'Bob Wilson',
      userEmail: 'bob@example.com',
      name: 'Ice Rink Safety Certification',
      type: 'internal',
      status: 'expired',
      issueDate: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000),
      expirationDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    },
  ];

  let filtered = certifications;
  if (filter?.userId) {
    filtered = filtered.filter((c) => c.userId === filter.userId);
  }
  if (filter?.type) {
    filtered = filtered.filter((c) => c.type === filter.type);
  }
  if (filter?.status) {
    filtered = filtered.filter((c) => c.status === filter.status);
  }
  if (filter?.expiringSoon) {
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(
      (c) => c.expirationDate && c.expirationDate <= thirtyDaysFromNow && c.status !== 'expired'
    );
  }

  return filtered;
}

// Get training stats
export async function getTrainingStats(): Promise<TrainingStats> {
  return {
    totalCourses: 42,
    totalEnrollments: 156,
    totalCompletions: 128,
    averageCompletionRate: 82,
    averageScore: 86,
    activeCertifications: 89,
    expiringSoon: 7,
    overdueAssignments: 4,
    complianceRate: 94,
  };
}

// Get staff training records
export async function getStaffTrainingRecords(): Promise<StaffTrainingRecord[]> {
  return [
    {
      userId: 'user-1',
      userName: 'John Smith',
      userRole: 'Ice Technician',
      facilityId: 'fac-1',
      facilityName: 'Central Ice Arena',
      totalCourses: 8,
      completedCourses: 6,
      inProgressCourses: 2,
      overdueCourses: 0,
      certifications: 4,
      expiringCertifications: 0,
      complianceScore: 95,
      lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      userId: 'user-2',
      userName: 'Jane Doe',
      userRole: 'Operations Manager',
      facilityId: 'fac-1',
      facilityName: 'Central Ice Arena',
      totalCourses: 12,
      completedCourses: 10,
      inProgressCourses: 1,
      overdueCourses: 1,
      certifications: 6,
      expiringCertifications: 1,
      complianceScore: 88,
      lastActivityAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      userId: 'user-3',
      userName: 'Bob Wilson',
      userRole: 'Front Desk',
      facilityId: 'fac-1',
      facilityName: 'Central Ice Arena',
      totalCourses: 5,
      completedCourses: 3,
      inProgressCourses: 1,
      overdueCourses: 1,
      certifications: 2,
      expiringCertifications: 1,
      complianceScore: 72,
      lastActivityAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];
}

// Get upcoming sessions
export async function getTrainingSchedule(): Promise<TrainingSchedule[]> {
  const now = new Date();

  return [
    {
      id: 'sched-1',
      courseId: 'course-3',
      courseTitle: 'First Aid & CPR/AED',
      type: 'in_person',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      location: 'Training Room A',
      instructorName: 'Red Cross Instructor',
      maxCapacity: 15,
      enrolledCount: 12,
      waitlistCount: 2,
      status: 'scheduled',
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'sched-2',
      courseId: 'course-2',
      courseTitle: 'Zamboni Operation Certification',
      type: 'in_person',
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      location: 'Equipment Bay',
      instructorName: 'Mike Johnson',
      maxCapacity: 6,
      enrolledCount: 4,
      waitlistCount: 0,
      status: 'scheduled',
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  ];
}

// Course type labels
export const courseTypeLabels: Record<CourseType, string> = {
  online: 'Online',
  in_person: 'In-Person',
  hybrid: 'Hybrid',
  self_paced: 'Self-Paced',
};

// Enrollment status labels
export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  enrolled: 'Enrolled',
  in_progress: 'In Progress',
  completed: 'Completed',
  expired: 'Expired',
  failed: 'Failed',
};

// Certification status labels
export const certificationStatusLabels: Record<CertificationStatus, string> = {
  active: 'Active',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
  revoked: 'Revoked',
};

// Get status colors
export function getEnrollmentStatusColor(status: EnrollmentStatus): string {
  const colors: Record<EnrollmentStatus, string> = {
    enrolled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    expired: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status];
}

export function getCertificationStatusColor(status: CertificationStatus): string {
  const colors: Record<CertificationStatus, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    expiring_soon: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    revoked: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  };
  return colors[status];
}

// Format duration
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
