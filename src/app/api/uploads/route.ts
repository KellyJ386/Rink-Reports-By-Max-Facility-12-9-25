import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateFile, FILE_SIZE_LIMITS, ALLOWED_MIME_TYPES } from '@/lib/validation/file-upload';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure max file size (50MB)
export const config = {
  api: {
    bodyParser: false,
  },
};

// POST - Upload file(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const entityType = formData.get('entityType') as string; // e.g., 'form_submission', 'incident'
    const entityId = formData.get('entityId') as string;

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Get user's facility
    const facilityUser = await prisma.facilityUser.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!facilityUser) {
      return NextResponse.json(
        { error: 'User not associated with any facility' },
        { status: 403 }
      );
    }

    const uploadResults: Array<{
      id: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      url: string;
    }> = [];
    const errors: string[] = [];

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', facilityUser.facilityId);
    await mkdir(uploadsDir, { recursive: true });

    for (const file of files) {
      // Validate file
      const validation = validateFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
        continue;
      }

      // Generate unique filename
      const fileExtension = file.name.split('.').pop() || '';
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = join(uploadsDir, uniqueFileName);

      // Write file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Create attachment record in database
      const attachment = await prisma.attachment.create({
        data: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          filePath: `/uploads/${facilityUser.facilityId}/${uniqueFileName}`,
          uploadedById: session.user.id,
          facilityId: facilityUser.facilityId,
          entityType: entityType || null,
          entityId: entityId || null,
        },
      });

      uploadResults.push({
        id: attachment.id,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        url: attachment.filePath,
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'Attachment',
        entityId: uploadResults.map(r => r.id).join(','),
        newValues: {
          filesUploaded: uploadResults.length,
          fileNames: uploadResults.map(r => r.fileName),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

// GET - Get upload limits and allowed types
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      maxFileSize: FILE_SIZE_LIMITS.default,
      maxImageSize: FILE_SIZE_LIMITS.image,
      maxDocumentSize: FILE_SIZE_LIMITS.document,
      maxVideoSize: FILE_SIZE_LIMITS.video,
      allowedImageTypes: ALLOWED_MIME_TYPES.image,
      allowedDocumentTypes: ALLOWED_MIME_TYPES.document,
      allowedVideoTypes: ALLOWED_MIME_TYPES.video,
    },
  });
}

// DELETE - Delete an uploaded file
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment ID required' }, { status: 400 });
    }

    // Find the attachment
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Check permission (owner or admin)
    const isOwner = attachment.uploadedById === session.user.id;
    const isAdmin = ['ADMIN', 'FACILITY_MANAGER', 'SUPER_ADMIN'].includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this file' },
        { status: 403 }
      );
    }

    // Soft delete by marking as deleted (keep file for audit purposes)
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'Attachment',
        entityId: attachmentId,
        oldValues: {
          fileName: attachment.fileName,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
