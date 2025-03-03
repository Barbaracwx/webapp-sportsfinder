import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { telegramId, matchPreferences } = await req.json();

    // Validate input
    if (!telegramId || !matchPreferences) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Save match preferences to the database
    const updatedUser = await prisma.user.update({
      where: { telegramId },
      data: {
        matchPreferences: JSON.stringify(matchPreferences), // Save as JSON string
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving match preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}