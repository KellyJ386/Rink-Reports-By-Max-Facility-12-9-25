'use client';

import { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClockIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  CalendarIcon,
  ChartBarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  getTrainingCourses,
  getTrainingCategories,
  getTrainingStats,
  getEnrollments,
  getCertifications,
  getStaffTrainingRecords,
  getTrainingSchedule,
  courseTypeLabels,
  enrollmentStatusLabels,
  certificationStatusLabels,
  getEnrollmentStatusColor,
  getCertificationStatusColor,
  formatDuration,
} from '@/lib/training';
import type {
  TrainingCourse,
  TrainingCategory,
  TrainingStats,
  Enrollment,
  Certification,
  StaffTrainingRecord,
  TrainingSchedule,
} from '@/lib/training';
import { cn } from '@/lib/utils';

type TabType = 'courses' | 'my_learning' | 'certifications' | 'team' | 'schedule';

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [staffRecords, setStaffRecords] = useState<StaffTrainingRecord[]>([]);
  const [schedule, setSchedule] = useState<TrainingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesData, catsData, statsData, enrollData, certData, staffData, schedData] = await Promise.all([
        getTrainingCourses(),
        getTrainingCategories(),
        getTrainingStats(),
        getEnrollments(),
        getCertifications(),
        getStaffTrainingRecords(),
        getTrainingSchedule(),
      ]);

      setCourses(coursesData);
      setCategories(catsData);
      setStats(statsData);
      setEnrollments(enrollData);
      setCertifications(certData);
      setStaffRecords(staffData);
      setSchedule(schedData);
    } catch (error) {
      console.error('Failed to load training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = selectedCategory
    ? courses.filter((c) => c.categoryId === selectedCategory)
    : courses;

  const tabs = [
    { id: 'courses' as const, label: 'Courses', icon: BookOpenIcon },
    { id: 'my_learning' as const, label: 'My Learning', icon: AcademicCapIcon },
    { id: 'certifications' as const, label: 'Certifications', icon: CheckBadgeIcon },
    { id: 'team' as const, label: 'Team Progress', icon: UserGroupIcon },
    { id: 'schedule' as const, label: 'Schedule', icon: CalendarIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Training & Certifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage training programs, track certifications, and monitor compliance
          </p>
        </div>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpenIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Courses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalCourses}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckBadgeIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageCompletionRate}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <AcademicCapIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Certifications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeCertifications}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.expiringSoon}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Compliance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.complianceRate}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b dark:border-gray-700">
        <div className="flex gap-4 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Categories Sidebar */}
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Categories</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                        !selectedCategory
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <span>All Courses</span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {courses.length}
                      </span>
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                          selectedCategory === cat.id
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        )}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {cat.courseCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Course Grid */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCourses.map((course) => (
                    <Card key={course.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            {courseTypeLabels[course.type]}
                          </span>
                          {course.isRequired && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <ClockIcon className="w-4 h-4" />
                          {formatDuration(course.duration)}
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {course.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {course.description}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900 dark:text-white">{course.completionCount}</span>
                          /{course.enrollmentCount} completed
                        </div>
                        {course.averageScore && (
                          <div className="text-sm text-gray-500">
                            Avg: <span className="font-medium text-gray-900 dark:text-white">{course.averageScore}%</span>
                          </div>
                        )}
                      </div>

                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${(course.completionCount / course.enrollmentCount) * 100}%` }}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex-1">
                          View Details
                        </Button>
                        <Button size="sm" className="flex-1">
                          <PlayIcon className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* My Learning Tab */}
          {activeTab === 'my_learning' && (
            <div className="space-y-6">
              {/* In Progress */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">In Progress</h3>
                <div className="grid gap-4">
                  {enrollments.filter((e) => e.status === 'in_progress').map((enrollment) => (
                    <Card key={enrollment.id} className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {enrollment.courseTitle}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Started {enrollment.startedAt.toLocaleDateString()}
                            {enrollment.dueDate && ` • Due ${enrollment.dueDate.toLocaleDateString()}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="w-32">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-medium text-gray-900 dark:text-white">{enrollment.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${enrollment.progress}%` }}
                              />
                            </div>
                          </div>
                          <Button size="sm">
                            <PlayIcon className="w-4 h-4 mr-1" />
                            Continue
                          </Button>
                        </div>
                      </div>

                      {/* Module Progress */}
                      <div className="mt-4 pt-4 border-t dark:border-gray-700">
                        <div className="flex gap-2 overflow-x-auto">
                          {enrollment.moduleProgress.map((module, index) => (
                            <div
                              key={module.moduleId}
                              className={cn(
                                'flex-shrink-0 px-3 py-2 rounded-lg text-xs',
                                module.status === 'completed'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : module.status === 'in_progress'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                              )}
                            >
                              Module {index + 1}: {module.status.replace('_', ' ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Completed */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Completed</h3>
                <div className="grid gap-4">
                  {enrollments.filter((e) => e.status === 'completed').map((enrollment) => (
                    <Card key={enrollment.id} className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {enrollment.courseTitle}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Completed {enrollment.completedAt?.toLocaleDateString()}
                            {enrollment.score && ` • Score: ${enrollment.score}%`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                            Completed
                          </span>
                          {enrollment.certificateId && (
                            <Button variant="ghost" size="sm">
                              <CheckBadgeIcon className="w-4 h-4 mr-1" />
                              View Certificate
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === 'certifications' && (
            <div className="grid gap-4">
              {certifications.map((cert) => (
                <Card key={cert.id} className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'p-3 rounded-lg',
                        cert.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : cert.status === 'expiring_soon'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      )}>
                        <CheckBadgeIcon className={cn(
                          'w-6 h-6',
                          cert.status === 'active'
                            ? 'text-green-600 dark:text-green-400'
                            : cert.status === 'expiring_soon'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        )} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{cert.name}</h4>
                        <p className="text-sm text-gray-500">{cert.userName}</p>
                        {cert.issuingOrganization && (
                          <p className="text-sm text-gray-500">Issued by: {cert.issuingOrganization}</p>
                        )}
                        {cert.skills && (
                          <div className="flex gap-1 mt-2">
                            {cert.skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={cn('px-3 py-1 text-sm font-medium rounded-full', getCertificationStatusColor(cert.status))}>
                        {certificationStatusLabels[cert.status]}
                      </span>
                      <div className="text-sm text-gray-500">
                        {cert.expirationDate ? (
                          <>Expires: {cert.expirationDate.toLocaleDateString()}</>
                        ) : (
                          <>Issued: {cert.issueDate.toLocaleDateString()}</>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">View Details</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Team Progress Tab */}
          {activeTab === 'team' && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 text-center">Completed</th>
                      <th className="px-4 py-3 text-center">In Progress</th>
                      <th className="px-4 py-3 text-center">Overdue</th>
                      <th className="px-4 py-3 text-center">Certifications</th>
                      <th className="px-4 py-3 text-center">Compliance</th>
                      <th className="px-4 py-3">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {staffRecords.map((record) => (
                      <tr key={record.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {record.userName}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {record.userRole}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-green-600 font-medium">{record.completedCourses}</span>
                          /{record.totalCourses}
                        </td>
                        <td className="px-4 py-3 text-center text-yellow-600">
                          {record.inProgressCourses}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {record.overdueCourses > 0 ? (
                            <span className="text-red-600 font-medium">{record.overdueCourses}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {record.certifications}
                          {record.expiringCertifications > 0 && (
                            <span className="ml-1 text-yellow-600">({record.expiringCertifications})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'font-medium',
                            record.complianceScore >= 90 ? 'text-green-600' :
                            record.complianceScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                          )}>
                            {record.complianceScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {record.lastActivityAt?.toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Sessions</h3>
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Schedule Session
                </Button>
              </div>

              <div className="grid gap-4">
                {schedule.map((session) => (
                  <Card key={session.id} className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-shrink-0 text-center p-4 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <p className="text-xs text-primary-600 dark:text-primary-400 uppercase">
                          {session.startDate.toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                        <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                          {session.startDate.getDate()}
                        </p>
                      </div>

                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{session.courseTitle}</h4>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {session.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                            {session.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {session.location && (
                            <span>{session.location}</span>
                          )}
                          {session.instructorName && (
                            <span>Instructor: {session.instructorName}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900 dark:text-white">{session.enrolledCount}</span>
                          /{session.maxCapacity} enrolled
                          {session.waitlistCount > 0 && (
                            <span className="ml-2 text-yellow-600">+{session.waitlistCount} waitlist</span>
                          )}
                        </div>
                        <Button size="sm">
                          {session.enrolledCount < session.maxCapacity ? 'Enroll' : 'Join Waitlist'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
