import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { telegramId, gender, location, age } = await req.json()

        // Validate input
        if (!telegramId || !gender || !location || !age || 
            (gender !== 'Male' && gender !== 'Female') ||
            typeof age !== 'number' || age < 1 || age > 100) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
        }

        // Update user with profile, including age
        const updatedUser = await prisma.user.update({
            where: { telegramId },
            data: { gender, location, age }
        })

        return NextResponse.json({ 
            success: true, 
            gender: updatedUser.gender, 
            location: updatedUser.location,
            age: updatedUser.age
        })
    } catch (error) {
        console.error('Error saving profile:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
