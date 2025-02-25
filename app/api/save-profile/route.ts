import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { telegramId, gender } = await req.json()

        // Validate input
        if (!telegramId || !gender || (gender !== 'Male' && gender !== 'Female')) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
        }

        // Update user with gender
        const updatedUser = await prisma.user.update({
            where: { telegramId },
            data: { gender }
        })

        return NextResponse.json({ success: true, gender: updatedUser.gender })
    } catch (error) {
        console.error('Error saving gender:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
