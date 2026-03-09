// ✅ FIX: Stub functions để tránh lỗi import
// File này được dùng như fallback cho legacy code
// Nên migrate sang PostgreSQL (lib/database.ts) trong tương lai

/**
 * @deprecated Sử dụng lib/database.ts thay vì mysql.ts
 * Fallback functions để tương thích với code cũ
 */

// Mock data store (in-memory)
const mockUsers: any[] = [];
const mockNotifications: any[] = [];

export function getUserData(): any[] {
  console.warn('⚠️ getUserData() from mysql.ts is deprecated. Use lib/database.ts instead.');
  return mockUsers;
}

export function saveUserData(userData: any): void {
  console.warn('⚠️ saveUserData() from mysql.ts is deprecated. Use lib/database.ts instead.');
  const index = mockUsers.findIndex((u: any) => u.uid === userData.uid);
  if (index >= 0) {
    mockUsers[index] = { ...mockUsers[index], ...userData };
  } else {
    mockUsers.push(userData);
  }
}

export function saveUser(userData: any): void {
  console.warn('⚠️ saveUser() from mysql.ts is deprecated. Use lib/database.ts instead.');
  saveUserData(userData);
}

export function saveNotification(notification: any): any {
  console.warn('⚠️ saveNotification() from mysql.ts is deprecated. Use lib/database.ts instead.');
  mockNotifications.push({ ...notification, id: mockNotifications.length + 1 });
  return { success: true, id: mockNotifications.length };
}

export function requestPasswordReset(email: string, token: string): void {
  console.warn('⚠️ requestPasswordReset() from mysql.ts is deprecated. Use lib/database.ts instead.');
  // Implement nếu cần
}

export function onUsersChange(callback: (users: any[]) => void): void {
  console.warn('⚠️ onUsersChange() from mysql.ts is deprecated. Use realtime database instead.');
  // No-op for now
}

