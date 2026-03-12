import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();
    
    if (!uid) {
      return NextResponse.json({ success: false, error: 'UID is required' }, { status: 400 });
    }

    // ✅ FIX: Dùng requireAdmin() thay vì check X-Admin-Auth header
    const { requireAdmin } = await import('@/lib/api-auth');
    try {
      await requireAdmin(request);
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message || 'Unauthorized' }, { status: 401 });
    }

    // ✅ FIX: Use Firebase Admin SDK instead of client-side Firestore
    let firestoreUser: any = null;
    try {
      const { getApps, initializeApp, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');
      
      if (getApps().length === 0) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      }
      
      const adminDb = getFirestore();
      const userDoc = await adminDb.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return NextResponse.json({ success: false, error: 'User not found in Firestore' }, { status: 404 });
      }
      
      firestoreUser = userDoc.data();
      
      // Update with lastSync timestamp
      await adminDb.collection('users').doc(uid).set({
        ...firestoreUser,
        lastSync: new Date().toISOString(),
        syncStatus: 'synced'
      }, { merge: true });
    } catch (fbError: any) {
      logger.warn('Firebase Admin not available for sync', { error: fbError.message });
      return NextResponse.json({ 
        success: false, 
        error: 'Firebase not configured or not available' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: firestoreUser,
      message: 'User synced successfully'
    });

  } catch (error: any) {
    logger.error('Force sync error', error, { endpoint: '/api/admin/force-sync-user' });
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
