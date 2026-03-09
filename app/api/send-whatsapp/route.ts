import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { to, body } = await request.json();

    // Ensure environment variables are set
    const data = await sendWhatsAppMessage({ to, body });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Error sending WhatsApp message', error);
    return NextResponse.json(
      {
        error: 'Failed to send WhatsApp message',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
