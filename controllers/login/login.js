const moment = require('moment')
const { query } = require('../../config/db')
const { z } = require('zod')
const bcrypt = require('bcrypt')

const login = async (request, reply) => {
    // Validate request body
    const parseResult = z.object({
        username: z.string().min(1),
        password: z.string().min(1)
    }).safeParse(request.body)

    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors
        })
    }

    const { username, password } = parseResult.data;

    // 1. ตรวจสอบจากฐานข้อมูลว่าเจอ username หรือไม่
    const sql = 'SELECT * FROM users WHERE username = ?';
    let users;
    try {
        users = await query(sql, [username]);
    } catch (err) {
        return reply.status(500).send({ message: 'Database error', error: err.message });
    }

    if (!users || users.length === 0) {
        return reply.status(401).send({ message: 'Username not found' });
    }

    const user = users[0];

    // 2. ถ้าเจอ → ตรวจสอบ password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return reply.status(401).send({ message: 'Incorrect password' });
    }

    // 3. ถ้าเจอทั้ง 2 login สำเร็จ → สร้าง JWT Token และส่งกลับ
    let token;
    try {
        if (reply.jwtSign) {
            token = await reply.jwtSign({
                user_id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                role_id: user.role_id
            });
        } else {
            return reply.status(500).send({ message: 'JWT Error', error: 'reply.jwtSign is not available. Please check Fastify JWT plugin registration.' });
        }
    } catch (err) {
        return reply.status(500).send({ message: 'JWT Error', error: err.message });
    }
    console.log(user)

    return reply.send({
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            role_id: user.role_id
        }
    });
}


module.exports = { login }