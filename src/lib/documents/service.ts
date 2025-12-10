// Document Management Service

import type {
  Document,
  DocumentCategory,
  DocumentVersion,
  DocumentPermission,
  DocumentShare,
  DocumentAuditLog,
  DocumentTemplate,
  DocumentFilter,
  DocumentStats,
  DocumentType,
  DocumentStatus,
  FolderStructure,
} from './types';

// Get document categories
export async function getDocumentCategories(): Promise<DocumentCategory[]> {
  return [
    { id: 'cat-policies', name: 'Policies & Procedures', documentCount: 24, color: 'blue' },
    { id: 'cat-safety', name: 'Safety Documents', documentCount: 18, color: 'red' },
    { id: 'cat-hr', name: 'HR & Training', documentCount: 32, color: 'purple' },
    { id: 'cat-operations', name: 'Operations', documentCount: 15, color: 'green' },
    { id: 'cat-compliance', name: 'Compliance & Permits', documentCount: 12, color: 'yellow' },
    { id: 'cat-contracts', name: 'Contracts & Agreements', documentCount: 28, color: 'gray' },
    { id: 'cat-reports', name: 'Reports', documentCount: 45, color: 'indigo' },
    { id: 'cat-forms', name: 'Forms & Templates', documentCount: 20, color: 'pink' },
  ];
}

// Get documents
export async function getDocuments(filter?: DocumentFilter): Promise<Document[]> {
  const now = new Date();

  const documents: Document[] = [
    {
      id: 'doc-1',
      title: 'Employee Safety Handbook',
      description: 'Comprehensive safety guidelines for all staff members',
      type: 'manual',
      categoryId: 'cat-safety',
      categoryName: 'Safety Documents',
      status: 'approved',
      currentVersionId: 'ver-1-3',
      currentVersion: 3,
      fileType: 'application/pdf',
      fileSize: 2456000,
      fileName: 'employee-safety-handbook-v3.pdf',
      fileUrl: '/documents/employee-safety-handbook-v3.pdf',
      tags: ['safety', 'required', 'handbook'],
      reviewDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      isRequired: true,
      isPublic: false,
      createdBy: 'user-1',
      createdByName: 'Admin User',
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-01-10'),
      downloadCount: 156,
    },
    {
      id: 'doc-2',
      title: 'Ice Resurfacing Procedure',
      description: 'Standard operating procedure for Zamboni operation and ice maintenance',
      type: 'procedure',
      categoryId: 'cat-operations',
      categoryName: 'Operations',
      status: 'approved',
      currentVersionId: 'ver-2-2',
      currentVersion: 2,
      fileType: 'application/pdf',
      fileSize: 1245000,
      fileName: 'ice-resurfacing-sop-v2.pdf',
      fileUrl: '/documents/ice-resurfacing-sop-v2.pdf',
      tags: ['ice', 'zamboni', 'maintenance', 'sop'],
      isRequired: false,
      isPublic: false,
      createdBy: 'user-2',
      createdByName: 'Operations Manager',
      createdAt: new Date('2023-03-20'),
      updatedAt: new Date('2023-11-15'),
      downloadCount: 89,
    },
    {
      id: 'doc-3',
      title: 'Facility Rental Agreement',
      description: 'Standard rental agreement template for private ice rentals',
      type: 'contract',
      categoryId: 'cat-contracts',
      categoryName: 'Contracts & Agreements',
      status: 'approved',
      currentVersionId: 'ver-3-4',
      currentVersion: 4,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 98000,
      fileName: 'rental-agreement-template-v4.docx',
      fileUrl: '/documents/rental-agreement-template-v4.docx',
      tags: ['rental', 'contract', 'template', 'legal'],
      isRequired: false,
      isPublic: true,
      createdBy: 'user-1',
      createdByName: 'Admin User',
      createdAt: new Date('2022-06-01'),
      updatedAt: new Date('2024-01-05'),
      downloadCount: 234,
    },
    {
      id: 'doc-4',
      title: 'Business License 2024',
      description: 'Current business operating license',
      type: 'permit',
      categoryId: 'cat-compliance',
      categoryName: 'Compliance & Permits',
      facilityId: 'fac-1',
      facilityName: 'Central Ice Arena',
      status: 'approved',
      currentVersionId: 'ver-4-1',
      currentVersion: 1,
      fileType: 'application/pdf',
      fileSize: 456000,
      fileName: 'business-license-2024.pdf',
      fileUrl: '/documents/business-license-2024.pdf',
      tags: ['license', 'compliance', '2024'],
      expirationDate: new Date('2024-12-31'),
      isRequired: true,
      isPublic: false,
      createdBy: 'user-1',
      createdByName: 'Admin User',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      downloadCount: 12,
    },
    {
      id: 'doc-5',
      title: 'Liability Insurance Certificate',
      description: 'Certificate of liability insurance coverage',
      type: 'insurance',
      categoryId: 'cat-compliance',
      categoryName: 'Compliance & Permits',
      status: 'approved',
      currentVersionId: 'ver-5-1',
      currentVersion: 1,
      fileType: 'application/pdf',
      fileSize: 234000,
      fileName: 'liability-insurance-2024.pdf',
      fileUrl: '/documents/liability-insurance-2024.pdf',
      tags: ['insurance', 'liability', 'certificate'],
      expirationDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // Expiring soon
      isRequired: true,
      isPublic: false,
      createdBy: 'user-1',
      createdByName: 'Admin User',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      downloadCount: 8,
    },
    {
      id: 'doc-6',
      title: 'New Employee Onboarding Checklist',
      description: 'Checklist for HR onboarding process',
      type: 'form',
      categoryId: 'cat-hr',
      categoryName: 'HR & Training',
      status: 'pending_review',
      currentVersionId: 'ver-6-1',
      currentVersion: 1,
      fileType: 'application/pdf',
      fileSize: 189000,
      fileName: 'onboarding-checklist-draft.pdf',
      fileUrl: '/documents/onboarding-checklist-draft.pdf',
      tags: ['hr', 'onboarding', 'checklist', 'new hire'],
      isRequired: false,
      isPublic: false,
      createdBy: 'user-3',
      createdByName: 'HR Manager',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      downloadCount: 2,
    },
  ];

  let filtered = documents;

  if (filter?.type) {
    filtered = filtered.filter((d) => d.type === filter.type);
  }
  if (filter?.categoryId) {
    filtered = filtered.filter((d) => d.categoryId === filter.categoryId);
  }
  if (filter?.status) {
    filtered = filtered.filter((d) => d.status === filter.status);
  }
  if (filter?.search) {
    const search = filter.search.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.title.toLowerCase().includes(search) ||
        d.description?.toLowerCase().includes(search) ||
        d.tags.some((t) => t.toLowerCase().includes(search))
    );
  }
  if (filter?.isExpiringSoon) {
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(
      (d) => d.expirationDate && d.expirationDate <= thirtyDaysFromNow
    );
  }

  return filtered;
}

// Get single document
export async function getDocument(documentId: string): Promise<Document | null> {
  const documents = await getDocuments();
  return documents.find((d) => d.id === documentId) || null;
}

// Get document versions
export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  return [
    {
      id: 'ver-1-3',
      documentId,
      version: 3,
      fileName: 'employee-safety-handbook-v3.pdf',
      fileUrl: '/documents/employee-safety-handbook-v3.pdf',
      fileSize: 2456000,
      fileType: 'application/pdf',
      changes: 'Updated emergency procedures section',
      uploadedBy: 'user-1',
      uploadedByName: 'Admin User',
      uploadedAt: new Date('2024-01-10'),
      isLatest: true,
    },
    {
      id: 'ver-1-2',
      documentId,
      version: 2,
      fileName: 'employee-safety-handbook-v2.pdf',
      fileUrl: '/documents/employee-safety-handbook-v2.pdf',
      fileSize: 2340000,
      fileType: 'application/pdf',
      changes: 'Added new PPE requirements',
      uploadedBy: 'user-1',
      uploadedByName: 'Admin User',
      uploadedAt: new Date('2023-06-15'),
      isLatest: false,
    },
    {
      id: 'ver-1-1',
      documentId,
      version: 1,
      fileName: 'employee-safety-handbook-v1.pdf',
      fileUrl: '/documents/employee-safety-handbook-v1.pdf',
      fileSize: 2100000,
      fileType: 'application/pdf',
      changes: 'Initial version',
      uploadedBy: 'user-1',
      uploadedByName: 'Admin User',
      uploadedAt: new Date('2023-01-15'),
      isLatest: false,
    },
  ];
}

// Upload new version
export async function uploadDocumentVersion(
  documentId: string,
  file: File,
  changes?: string
): Promise<DocumentVersion> {
  return {
    id: `ver-${Date.now()}`,
    documentId,
    version: 4,
    fileName: file.name,
    fileUrl: `/documents/${file.name}`,
    fileSize: file.size,
    fileType: file.type,
    changes,
    uploadedBy: 'user-1',
    uploadedByName: 'Current User',
    uploadedAt: new Date(),
    isLatest: true,
  };
}

// Get document shares
export async function getDocumentShares(documentId: string): Promise<DocumentShare[]> {
  return [
    {
      id: 'share-1',
      documentId,
      documentTitle: 'Facility Rental Agreement',
      shareType: 'link',
      accessLevel: 'download',
      shareLink: 'https://example.com/share/abc123',
      password: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      accessCount: 15,
      lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ];
}

// Create document share
export async function createDocumentShare(
  documentId: string,
  options: {
    shareType: 'link' | 'email' | 'user';
    accessLevel: 'view' | 'download';
    recipientEmail?: string;
    recipientUserId?: string;
    expiresAt?: Date;
    password?: string;
  }
): Promise<DocumentShare> {
  return {
    id: `share-${Date.now()}`,
    documentId,
    documentTitle: 'Document',
    shareType: options.shareType,
    accessLevel: options.accessLevel,
    recipientEmail: options.recipientEmail,
    recipientUserId: options.recipientUserId,
    shareLink: options.shareType === 'link' ? `https://example.com/share/${Date.now()}` : undefined,
    password: !!options.password,
    expiresAt: options.expiresAt,
    accessCount: 0,
    createdBy: 'user-1',
    createdAt: new Date(),
  };
}

// Get document audit log
export async function getDocumentAuditLog(documentId?: string): Promise<DocumentAuditLog[]> {
  const now = new Date();
  return [
    {
      id: 'audit-1',
      documentId: 'doc-1',
      documentTitle: 'Employee Safety Handbook',
      action: 'downloaded',
      userId: 'user-5',
      userName: 'John Smith',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'audit-2',
      documentId: 'doc-3',
      documentTitle: 'Facility Rental Agreement',
      action: 'shared',
      userId: 'user-1',
      userName: 'Admin User',
      details: 'Created public share link',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      id: 'audit-3',
      documentId: 'doc-1',
      documentTitle: 'Employee Safety Handbook',
      action: 'updated',
      userId: 'user-1',
      userName: 'Admin User',
      details: 'Uploaded version 3',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      id: 'audit-4',
      documentId: 'doc-6',
      documentTitle: 'New Employee Onboarding Checklist',
      action: 'created',
      userId: 'user-3',
      userName: 'HR Manager',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  ];
}

// Get document stats
export async function getDocumentStats(): Promise<DocumentStats> {
  return {
    totalDocuments: 194,
    byType: {
      policy: 15,
      procedure: 28,
      form: 20,
      certificate: 12,
      contract: 28,
      report: 45,
      manual: 18,
      training: 14,
      permit: 8,
      insurance: 4,
      other: 2,
    },
    byStatus: {
      draft: 8,
      pending_review: 5,
      approved: 165,
      archived: 14,
      expired: 2,
    },
    totalStorageUsed: 2.4 * 1024 * 1024 * 1024, // 2.4 GB in bytes
    expiringThisMonth: 3,
    pendingReview: 5,
    recentlyUpdated: 12,
  };
}

// Get folder structure
export async function getFolderStructure(): Promise<FolderStructure[]> {
  return [
    {
      id: 'cat-policies',
      name: 'Policies & Procedures',
      documentCount: 24,
      children: [
        { id: 'cat-policies-hr', name: 'HR Policies', documentCount: 12 },
        { id: 'cat-policies-ops', name: 'Operations Policies', documentCount: 12 },
      ],
    },
    {
      id: 'cat-safety',
      name: 'Safety Documents',
      documentCount: 18,
    },
    {
      id: 'cat-hr',
      name: 'HR & Training',
      documentCount: 32,
    },
    {
      id: 'cat-compliance',
      name: 'Compliance & Permits',
      documentCount: 12,
    },
    {
      id: 'cat-contracts',
      name: 'Contracts & Agreements',
      documentCount: 28,
    },
  ];
}

// Document type labels and icons
export const documentTypeLabels: Record<DocumentType, string> = {
  policy: 'Policy',
  procedure: 'Procedure',
  form: 'Form',
  certificate: 'Certificate',
  contract: 'Contract',
  report: 'Report',
  manual: 'Manual',
  training: 'Training Material',
  permit: 'Permit',
  insurance: 'Insurance',
  other: 'Other',
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  archived: 'Archived',
  expired: 'Expired',
};

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file type icon
export function getFileTypeIcon(fileType: string): string {
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('word') || fileType.includes('document')) return 'doc';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'xls';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'ppt';
  if (fileType.includes('image')) return 'img';
  return 'file';
}

// Get status color
export function getDocumentStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    pending_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    archived: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status];
}
