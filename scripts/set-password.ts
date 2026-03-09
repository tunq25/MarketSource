/**
 * Script: Thiết lập mật khẩu cho tài khoản đã tồn tại trong database
 * Usage: npx tsx scripts/set-password.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import pg from 'pg';
const { Pool } = pg;

const EMAIL = 'tunq25@uef.edu.vn';
const NEW_PASSWORD = '20022007';

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        console.log(`\n🔐 Thiết lập mật khẩu cho tài khoản: ${EMAIL}`);

        // 1. Kiểm tra user tồn tại
        const userResult = await pool.query(
            'SELECT id, email, name, password_hash, role FROM users WHERE email = $1',
            [EMAIL]
        );

        if (userResult.rows.length === 0) {
            console.error('❌ Không tìm thấy tài khoản với email:', EMAIL);
            process.exit(1);
        }

        const user = userResult.rows[0];
        console.log(`✅ Tìm thấy user: id=${user.id}, name=${user.name}, role=${user.role}`);
        console.log(`   Password hiện tại: ${user.password_hash ? '(Đã có)' : '(CHƯA CÓ - NULL)'}`);

        // 2. Hash mật khẩu mới
        const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);
        console.log(`🔑 Hash mật khẩu mới thành công`);

        // 3. Cập nhật vào database
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
            [passwordHash, EMAIL]
        );

        console.log(`\n🎉 ĐÃ CẬP NHẬT MẬT KHẨU THÀNH CÔNG!`);
        console.log(`   Email: ${EMAIL}`);
        console.log(`   Mật khẩu mới: ${NEW_PASSWORD}`);
        console.log(`   Bạn có thể đăng nhập ngay trên website.\n`);

    } catch (error: any) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        await pool.end();
    }
}

main();
