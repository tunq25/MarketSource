import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Test WhatsApp endpoint is active',
    timestamp: new Date().toISOString(),
  })
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Use POST to trigger WhatsApp test',
  })
}
