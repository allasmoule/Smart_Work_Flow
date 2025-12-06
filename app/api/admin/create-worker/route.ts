import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/withRole';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { error } = await requireRole(['ADMIN']);
  if (error) return error;

  try {
    try {
      const { email, name, password } = await req.json();

      if (!email || !name) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      const passwordHash = password ? await bcrypt.hash(password, 10) : null;

      const user = await prisma.user.create({
        data: {
          email,
          name,
          role: 'WORKER',
          passwordHash,
        },
      });

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch (error) {
      console.error('Error creating worker:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

