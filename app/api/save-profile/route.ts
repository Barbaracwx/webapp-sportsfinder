import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        // Parse the request body
        const { telegramId, gender, age, sports, displayName } = await req.json()

        // Validate input
        if (
            !telegramId || 
            !gender ||  
            !age || 
            (gender !== 'Male' && gender !== 'Female') ||
            typeof age !== 'number' || 
            age < 1 || 
            age > 100
        ) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
        }

        // Validate sports data (optional)
        if (sports && typeof sports !== 'object') {
            return NextResponse.json({ error: 'Invalid sports data' }, { status: 400 })
        }

        // Update user with profile, including age, sports, and displayName
        const updatedUser = await prisma.user.update({
            where: { telegramId },
            data: { 
                gender, 
                age,
                sports, // Save sports data (or null if not provided)
                displayName // Add displayName to the update
            }
        })

        return NextResponse.json({ 
            success: true, 
            gender: updatedUser.gender, 
            age: updatedUser.age,
            sports: updatedUser.sports, // Return the saved sports data
            displayName: updatedUser.displayName // Return the saved displayName
        })
    } catch (error) {
        console.error('Error saving profile:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}