import { z } from 'zod';

// File size limits in bytes
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB for images
  document: 25 * 1024 * 1024, // 25MB for documents
  default: 50 * 1024 * 1024, // 50MB default max
};

// Allowed MIME types by category
export const ALLOWED_MIME_TYPES = {
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/heic',
    'image/heif',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ],
  all: [] as string[], // Populated below
};

// Populate all allowed types
ALLOWED_MIME_TYPES.all = [
  ...ALLOWED_MIME_TYPES.image,
  ...ALLOWED_MIME_TYPES.document,
  ...ALLOWED_MIME_TYPES.video,
];

// File extension to MIME type mapping
export const EXTENSION_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  extension: string;
}

/**
 * Validate a file for upload
 */
export function validateFile(
  file: File | FileMetadata,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    category?: 'image' | 'document' | 'video' | 'all';
    required?: boolean;
  } = {}
): FileValidationResult {
  const {
    maxSize = FILE_SIZE_LIMITS.default,
    allowedTypes,
    category = 'all',
    required = false,
  } = options;

  // Get file properties
  const fileName = 'name' in file ? file.name : file.fileName;
  const fileSize = 'size' in file ? file.size : file.fileSize;
  const fileType = 'type' in file ? file.type : file.fileType;

  // Check if file exists when required
  if (!fileName && required) {
    return { valid: false, error: 'File is required' };
  }

  if (!fileName) {
    return { valid: true }; // Empty file is OK if not required
  }

  // Check file size
  if (fileSize > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${maxSizeMB}MB)`,
    };
  }

  // Determine allowed types
  const allowedMimeTypes = allowedTypes || ALLOWED_MIME_TYPES[category];

  // Check MIME type
  if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(fileType)) {
    return {
      valid: false,
      error: `File type "${fileType}" is not allowed. Allowed types: ${formatAllowedTypes(allowedMimeTypes)}`,
    };
  }

  // Validate file extension matches MIME type
  const extension = getFileExtension(fileName);
  const expectedMime = EXTENSION_TO_MIME[extension.toLowerCase()];

  if (expectedMime && expectedMime !== fileType) {
    return {
      valid: false,
      error: `File extension does not match file type. Expected ${expectedMime} for ${extension}`,
    };
  }

  // Sanitize filename
  const sanitizedName = sanitizeFileName(fileName);

  return { valid: true, sanitizedName };
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: (File | FileMetadata)[],
  options: {
    maxFiles?: number;
    maxTotalSize?: number;
    maxSizePerFile?: number;
    allowedTypes?: string[];
    category?: 'image' | 'document' | 'video' | 'all';
    required?: boolean;
  } = {}
): { valid: boolean; errors: string[]; validFiles: FileMetadata[] } {
  const {
    maxFiles = 10,
    maxTotalSize = 100 * 1024 * 1024, // 100MB total
    maxSizePerFile = FILE_SIZE_LIMITS.default,
    allowedTypes,
    category = 'all',
    required = false,
  } = options;

  const errors: string[] = [];
  const validFiles: FileMetadata[] = [];

  // Check required
  if (required && files.length === 0) {
    errors.push('At least one file is required');
    return { valid: false, errors, validFiles };
  }

  // Check max files
  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`);
    return { valid: false, errors, validFiles };
  }

  // Validate each file
  let totalSize = 0;
  for (const file of files) {
    const fileSize = 'size' in file ? file.size : file.fileSize;
    totalSize += fileSize;

    const result = validateFile(file, {
      maxSize: maxSizePerFile,
      allowedTypes,
      category,
    });

    if (!result.valid) {
      const fileName = 'name' in file ? file.name : file.fileName;
      errors.push(`${fileName}: ${result.error}`);
    } else {
      const fileName = 'name' in file ? file.name : file.fileName;
      const fileType = 'type' in file ? file.type : file.fileType;
      validFiles.push({
        fileName: result.sanitizedName || fileName,
        fileSize,
        fileType,
        extension: getFileExtension(fileName),
      });
    }
  }

  // Check total size
  if (totalSize > maxTotalSize) {
    const maxTotalMB = Math.round(maxTotalSize / (1024 * 1024));
    errors.push(`Total file size exceeds maximum allowed (${maxTotalMB}MB)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    validFiles,
  };
}

/**
 * Validate image file specifically
 */
export function validateImageFile(
  file: File | FileMetadata,
  options: {
    maxSize?: number;
    required?: boolean;
  } = {}
): FileValidationResult {
  return validateFile(file, {
    ...options,
    maxSize: options.maxSize || FILE_SIZE_LIMITS.image,
    category: 'image',
  });
}

/**
 * Validate document file specifically
 */
export function validateDocumentFile(
  file: File | FileMetadata,
  options: {
    maxSize?: number;
    required?: boolean;
  } = {}
): FileValidationResult {
  return validateFile(file, {
    ...options,
    maxSize: options.maxSize || FILE_SIZE_LIMITS.document,
    category: 'document',
  });
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFileName(fileName: string): string {
  // Get extension
  const extension = getFileExtension(fileName);
  const baseName = fileName.slice(0, fileName.length - extension.length);

  // Remove or replace unsafe characters
  const sanitized = baseName
    .replace(/[^\w\s.-]/g, '') // Remove special chars except . - _
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, '') // Trim underscores
    .slice(0, 100); // Limit length

  return `${sanitized || 'file'}${extension}`;
}

/**
 * Format allowed types for display
 */
function formatAllowedTypes(mimeTypes: string[]): string {
  const extensions: string[] = [];
  for (const [ext, mime] of Object.entries(EXTENSION_TO_MIME)) {
    if (mimeTypes.includes(mime)) {
      extensions.push(ext);
    }
  }
  return extensions.join(', ') || mimeTypes.join(', ');
}

/**
 * Zod schema for file upload validation
 */
export const fileUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive'),
  fileType: z.string().min(1, 'File type is required'),
  storageUrl: z.string().url('Invalid storage URL').optional(),
});

export const fileUploadArraySchema = z.array(fileUploadSchema);

/**
 * Check if a file is an image
 */
export function isImageFile(fileType: string): boolean {
  return ALLOWED_MIME_TYPES.image.includes(fileType);
}

/**
 * Check if a file is a document
 */
export function isDocumentFile(fileType: string): boolean {
  return ALLOWED_MIME_TYPES.document.includes(fileType);
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
