import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
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

    if (!isFirebaseConfigured() || !db) {
      return NextResponse.json({ success: false, error: 'Firebase not configured' }, { status: 500 });
    }

    // Get user from Firestore
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, error: 'User not found in Firestore' }, { status: 404 });
    }

    const firestoreUser = userSnap.data();
    
    // Update với lastSync timestamp
    await setDoc(userRef, {
      ...firestoreUser,
      lastSync: new Date().toISOString(),
      syncStatus: 'synced'
    }, { merge: true });

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
