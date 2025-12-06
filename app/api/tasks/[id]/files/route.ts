import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/withRole';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {

    const { fileUrl, fileName, fileSize, fileKey, mimeType } = await req.json();

    if (!fileUrl || !fileName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const file = await prisma.taskFile.create({
      data: {
        taskId: params.id,
        fileUrl,
        fileName,
        fileSize: fileSize || 0,
        mimeType,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json(file);
  } catch (error) {
    console.error('Error attaching file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

