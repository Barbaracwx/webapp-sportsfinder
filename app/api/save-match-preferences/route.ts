import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { telegramId, ageRanges } = await req.json();

    // Validate input
    if (!telegramId || !ageRanges) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Save age ranges to the database
    const updatedUser = await prisma.user.update({
      where: { telegramId },
      data: { matchPreferences: ageRanges }, // Save age ranges in the database
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving match preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}