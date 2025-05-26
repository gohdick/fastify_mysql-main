const moment = require('moment');
const { query } = require('../../config/db');
const { z } = require('zod');

const getAddressesList = async (req,reply) => {
    const sql = 'SELECT * FROM addresses'
    const rows = await query(sql)
    return reply.send(rows)
}



const getAddressesById = async (req,reply) => {
    const sql = 'SELECT * FROM addresses WHERE id = ?'
    const rows = await query(sql, [req.params.id])
    if (rows.length > 0) {
        return reply.send({
            message: 'Find addresses successfully',
            addresses: rows
        })
    } else {
        return reply.send({
            message: 'Not found addresses',
            addresses: rows
        })
    }
}

const addAddresses = async (req,reply) => {
    // Zod schema for validation
    const addressSchema = z.object({
        user_id: z.number({ required_error: 'user_id is required' }),
        address: z.string({ required_error: 'address is required' }),
        province_id: z.number({ required_error: 'province_id is required' }),
        district_id: z.number({ required_error: 'district_id is required' }),
        subdistricts_id: z.number({ required_error: 'subdistricts_id is required' }),
        zip_code: z.number({ required_error: 'zip_code is required' }),
        status: z.number({ required_error: 'status is required' })
    });
    const parseResult = addressSchema.safeParse(req.body);
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors
        });
    }
    
    const sql = 'INSERT INTO addresses (user_id, address, province_id, district_id, subdistricts_id, zip_code, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    const rows = await query(sql, [req.body.user_id, req.body.address, req.body.province_id, req.body.district_id, req.body.subdistricts_id, req.body.zip_code, req.body.status, moment().format('YYYY-MM-DD HH:mm:ss')])
    if (rows.affectedRows > 0) {
        return reply.send({
            message: 'add addresses success',
            addresses: rows
        })
    } else {
        return reply.send({
            message: 'add addresses failed',
            addresses: rows
        })
    }
}

const updateAddresses = async (req,reply) => {
    const addressSchema = z.object({
        user_id: z.number({ required_error: 'user_id is required' }),
        address: z.string({ required_error: 'address is required' }),
        province_id: z.number({ required_error: 'province_id is required' }),
        district_id: z.number({ required_error: 'district_id is required' }),
        subdistricts_id: z.number({ required_error: 'subdistricts_id is required' }),
        zip_code: z.number({ required_error: 'zip_code is required' }),
        status: z.number({ required_error: 'status is required' })
    });
    const parseResult = addressSchema.safeParse(req.body);
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors
        });
    }
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(req.body)) {
        if (value) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    }

    // Always update updated_at
    fields.push('updated_at = ?');
    values.push(moment().format('YYYY-MM-DD HH:mm:ss'));

    if (fields.length === 1) { // only updated_at
        return reply.status(400).send({ message: 'No fields to update' });
    }
    const sql = `UPDATE addresses SET ${fields.join(', ')} WHERE id = ?`
    values.push(req.params.id);
    const rows = await query(sql, values);

    if (rows.affectedRows > 0) {
        return reply.send({
            message: 'update addresses success',
            addresses: rows
        })
    } else {
        return reply.send({
            message: 'update addresses failed',
            addresses: rows
        })
    }
}

const deleteAddresses = async (req,reply) => {
    const sql = 'DELETE FROM addresses WHERE id = ?'
    const rows = await query(sql, [req.params.id])
    if (rows.affectedRows > 0) {
        return reply.send({
            message: 'delete addresses success',
            addresses: rows
        })
    } else {
        return reply.send({
            message: 'delete addresses failed',
            addresses: rows
        })
    }
}

module.exports = {
    getAddressesList,
    getAddressesById,
    addAddresses,
    updateAddresses,
    deleteAddresses
}