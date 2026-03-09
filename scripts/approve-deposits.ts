import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
    const client = await pool.connect();
    try {
        console.log('🔍 Đang duyệt deposit pending...');

        // Lấy danh sách deposit pending
        const deposits = await client.query(
            "SELECT id, user_id, amount, status FROM deposits WHERE status = 'pending'"
        );

        if (deposits.rows.length === 0) {
            console.log('✅ Không có deposit pending nào.');
            return;
        }

        for (const dep of deposits.rows) {
            console.log(`\n--- Deposit ID: ${dep.id}, User: ${dep.user_id}, Amount: ${dep.amount} ---`);

            await client.query('BEGIN');

            // Lấy balance hiện tại 
            const userResult = await client.query(
                'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
                [dep.user_id]
            );
            const currentBalance = parseFloat(userResult.rows[0]?.balance || '0');
            const depositAmount = parseFloat(dep.amount);
            const newBalance = currentBalance + depositAmount;

            // Approve deposit
            await client.query(
                "UPDATE deposits SET status = 'approved', approved_time = NOW(), approved_by = 'system' WHERE id = $1",
                [dep.id]
            );

            // Cộng balance
            await client.query(
                'UPDATE users SET balance = $1, updated_at = NOW() WHERE id = $2',
                [newBalance, dep.user_id]
            );

            await client.query('COMMIT');

            console.log(`✅ Approved! Balance: ${currentBalance} → ${newBalance}`);
        }

        // Kiểm tra lại
        const finalUser = await client.query("SELECT id, email, balance FROM users WHERE email = 'tunq25@uef.edu.vn'");
        console.log(`\n🎉 Final balance: ${finalUser.rows[0]?.balance}`);

    } catch (e: any) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
