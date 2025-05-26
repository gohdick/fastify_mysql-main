const moment = require('moment');
const { query } = require('../../config/db');
const bcrypt = require('bcrypt');
const { z } = require('zod');

const getUsersList = async (req,reply) => {
    const sql = 'SELECT * FROM users'
    const rows = await query(sql)
    return reply.send(rows)
}

const getUsersById = async (req,reply) => {
    const sql = 'SELECT * FROM users WHERE id = ?'
    const rows = await query(sql, [req.params.id])
    if (rows.length > 0) {
        return reply.send({
            message: 'Find users successfully',
            users: rows
        })
    } else {
        return reply.send({
            message: 'Not found users',
            users: rows
        })
    }
}

const addUsers = async (req,reply) => {
    // Zod schema for validation
    const userSchema = z.object({
        username: z.string({ required_error: 'username is required' }),
        password: z.string({ required_error: 'password is required' }),
        first_name: z.string({ required_error: 'first_name is required' }),
        last_name: z.string({ required_error: 'last_name is required' }),
        email: z.string({ required_error: 'email is required' }),
        phone: z.string({ required_error: 'phone is required' })
    });

    // Validate req.body
    const parseResult = userSchema.safeParse(req.body);
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors
        });
    }
    const password = await bcrypt.hash(req.body.password, 10);

    const [user] = await query('SELECT * FROM users WHERE username = ?', [req.body.username]);
    if (user) {
        return reply.status(400).send({
            message: 'Username already exists',
            errors: [
                {
                    field: 'username',
                    message: 'Username already exists'
                }
            ]
        });
    }

    const sql = 'INSERT INTO users (username, password, first_name, last_name, email, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    const rows = await query(sql, [req.body.username, password, req.body.first_name, req.body.last_name, req.body.email, req.body.phone, moment().format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD HH:mm:ss')])
    // console.log(rows)
    if (rows.affectedRows > 0) {
        return reply.send({
            message: 'add users success',
            users: rows
        })
    } else {
        return reply.send({
            message: 'add users failed',
            users: rows
        })
    }
}

const updateUsers = async (req, reply,fastify) => {

    const token = req.headers.authorization.split(' ')[1];
    const decoded = fastify.jwt.decode(token)
    console.log(decoded)
    // ตรวจสอบว่า id ใน token ตรงกับ id ที่จะ update หรือไม่
    if (parseInt(decoded.user_id) !== parseInt(req.params.id)) {
        return reply.status(401).send({ message: 'Unauthorized' });
    }

    // Partial update: all fields optional
    const userSchema = z.object({
        username: z.string().optional(),
        password: z.string().optional(),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional()
    });
    const parseResult = userSchema.safeParse(req.body);
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors
        });
    }

    // Check if user exists
    const [currentUser] = await query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!currentUser) {
        return reply.status(404).send({ message: 'User not found' });
    }

    // If username is being changed, check for duplicate
    if (req.body.username && req.body.username !== currentUser.username) {
        const [user] = await query('SELECT * FROM users WHERE username = ?', [req.body.username]);
        if (user) {
            return reply.status(400).send({
                message: 'Username already exists',
                errors: [
                    {
                        field: 'username',
                        message: 'Username already exists'
                    }
                ]
            });
        }
    }

    // Build dynamic update fields
    const fields = [];
    const values = [];
    // console.log(req.body)
    for (const [key, value] of Object.entries(req.body)) {
        if (value) {
            fields.push(`${key} = ?`);
            values.push(key === 'password' ? await bcrypt.hash(value, 10) : value);
        }
    }

    // Always update updated_at
    fields.push('updated_at = ?');
    values.push(moment().format('YYYY-MM-DD HH:mm:ss'));

    if (fields.length === 1) { // only updated_at
        return reply.status(400).send({ message: 'No fields to update' });
    }

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(req.params.id);
    const rows = await query(sql, values);
    if (rows.affectedRows > 0) {
        return reply.send({
            message: 'update users success',
            users: rows
        });
    } else {
        return reply.send({
            message: 'update users failed',
            users: rows
        });
    }
}

const deleteUsers = async (req,reply) => {
    const sql = 'DELETE FROM users WHERE id = ?'
    const rows = await query(sql, [req.params.id])
    if (rows.affectedRows > 0) {
        return reply.send({
            message: 'delete users success',
            users: rows
        });
    } else {
        return reply.send({
            message: 'delete users failed',
            users: rows
        });
    }
}

module.exports = {
    getUsersList,
    getUsersById,
    addUsers,
    updateUsers,
    deleteUsers
}
