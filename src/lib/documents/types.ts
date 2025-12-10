// Document Management Types

export type DocumentType =
  | 'policy'
  | 'procedure'
  | 'form'
  | 'certificate'
  | 'contract'
  | 'report'
  | 'manual'
  | 'training'
  | 'permit'
  | 'insurance'
  | 'other';

export type DocumentStatus = 'draft' | 'pending_review' | 'approved' | 'archived' | 'expired';

export type PermissionLevel = 'view' | 'edit' | 'manage' | 'owner';

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  documentCount: number;
  color?: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  type: DocumentType;
  categoryId: string;
  categoryName: string;
  facilityId?: string;
  facilityName?: string;
  status: DocumentStatus;
  currentVersionId: string;
  currentVersion: number;
  fileType: string;
  fileSize: number;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  expirationDate?: Date;
  reviewDate?: Date;
  isRequired: boolean;
  isPublic: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  downloadCount: number;
  metadata?: Record<string, unknown>;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  changes?: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  isLatest: boolean;
}

export interface DocumentPermission {
  id: string;
  documentId: string;
  userId?: string;
  userName?: string;
  roleId?: string;
  roleName?: string;
  facilityId?: string;
  facilityName?: string;
  level: PermissionLevel;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface DocumentShare {
  id: string;
  documentId: string;
  documentTitle: string;
  shareType: 'link' | 'email' | 'user';
  recipientEmail?: string;
  recipientUserId?: string;
  recipientName?: string;
  accessLevel: 'view' | 'download';
  shareLink?: string;
  password?: boolean;
  expiresAt?: Date;
  accessCount: number;
  lastAccessedAt?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  versionId?: string;
  userId: string;
  userName: string;
  content: string;
  parentId?: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentAuditLog {
  id: string;
  documentId: string;
  documentTitle: string;
  action: 'created' | 'updated' | 'viewed' | 'downloaded' | 'shared' | 'deleted' | 'restored' | 'permission_changed';
  userId: string;
  userName: string;
  details?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  categoryId: string;
  fileUrl: string;
  fileType: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentFilter {
  type?: DocumentType;
  categoryId?: string;
  facilityId?: string;
  status?: DocumentStatus;
  search?: string;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  isExpiringSoon?: boolean;
}

export interface DocumentStats {
  totalDocuments: number;
  byType: Record<DocumentType, number>;
  byStatus: Record<DocumentStatus, number>;
  totalStorageUsed: number;
  expiringThisMonth: number;
  pendingReview: number;
  recentlyUpdated: number;
}

export interface FolderStructure {
  id: string;
  name: string;
  parentId?: string;
  children?: FolderStructure[];
  documentCount: number;
  isExpanded?: boolean;
}
