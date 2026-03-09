export const runtime = 'nodejs'

// /app/api/check-tables/route.ts
import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/database-mysql";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    // Kiểm tra bảng users (MySQL syntax)
    const usersTableResult = await queryOne<any>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'users'
      ) as exists_table;
    `);
    const usersExists = usersTableResult?.exists_table === 1 || usersTableResult?.exists_table === true;

    // Kiểm tra bảng notifications
    const notificationsTableResult = await queryOne<any>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'notifications'
      ) as exists_table;
    `);
    const notificationsExists = notificationsTableResult?.exists_table === 1 || notificationsTableResult?.exists_table === true;

    let result = {
      users: { exists: usersExists, structure: null as any },
      notifications: { exists: notificationsExists, structure: null as any },
    };

    if (usersExists) {
      const usersColumnsResult = await query<any>(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'users'
        ORDER BY ordinal_position;
      `);
      result.users.structure = usersColumnsResult;
    } else {
      // Không tự động tạo bảng - dùng create-tables.sql thay vì
      result.users.exists = false;
      result.users.structure = null;
    }

    if (notificationsExists) {
      const notificationsColumnsResult = await query<any>(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'notifications'
        ORDER BY ordinal_position;
      `);
      result.notifications.structure = notificationsColumnsResult;
    } else {
      result.notifications.exists = false;
      result.notifications.structure = null;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
