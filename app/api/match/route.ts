import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/match
export async function POST(req: Request) {
  const { telegramId } = await req.json();

  try {
    // Fetch the user requesting a match
    const currentUser = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUser.isMatched) {
      return NextResponse.json({ error: 'User is already matched' }, { status: 400 });
    }

    // Find an unmatched user with similar preferences
    const potentialMatch = await prisma.user.findFirst({
      where: {
        telegramId: { not: telegramId }, // Ensure it's a different user
        isMatched: false,
        sports: { equals: currentUser.sports || {} }, // Match based on JSON sports
      },
    });

    if (!potentialMatch) {
      return NextResponse.json({ error: 'No matches found' }, { status: 404 });
    }

    // Create a match entry
    await prisma.match.create({
      data: {
        userAId: currentUser.telegramId,
        userBId: potentialMatch.telegramId,
      },
    });

    // Update both users as matched
    await prisma.user.updateMany({
      where: { telegramId: { in: [currentUser.telegramId, potentialMatch.telegramId] } },
      data: { isMatched: true },
    });

    return NextResponse.json({ match: { userA: currentUser.telegramId, userB: potentialMatch.telegramId } });
  } catch (error) {
    console.error('Error finding matches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
