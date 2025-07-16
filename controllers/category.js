const moment = require('moment'); 
const { query } = require('../config/db');
const { z } = require('zod');

// id
// name
// name_eng
// description
// created_at
// updated_at

const getCategoryList = async (req,reply) => {
    const sql = 'SELECT * FROM category'
    const rows = await query(sql)
    return reply.send({
        message: 'success',
        category: rows 
    })
}

const getCategoryById = async (req,reply) => {
    const sql = 'SELECT * FROM category WHERE id = ?'
    const rows = await query(sql, [req.params.id])
    if (rows.length > 0) {
        return reply.send({
            message: 'success',
            category: rows
        })
    } else {
        return reply.send({
            message: 'not found',
            category: rows
        })
    }
}

const addCategory = async (req,reply) => {
    const categorySchema = z.object({
        name: z.string({ required_error: 'name is required' }),
        name_eng: z.string({ required_error: 'name_eng is required' }),
        description: z.string({ required_error: 'description is required' })
    })
    const parseResult = categorySchema.safeParse(req.body)
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors
        })
    }
    const sql = 'INSERT INTO category (name, name_eng, description, created_at) VALUES (?, ?, ?, ?)'
    const rows = await query(sql, [req.body.name, req.body.name_eng, req.body.description, moment().format('YYYY-MM-DD HH:mm:ss')])
    return reply.send({
        message: 'success',
        category: rows
    })
}

const updateCategory = async (req,reply) => {
    const categorySchema = z.object({
        name: z.string({ required_error: 'name is required' }),
        name_eng: z.string({ required_error: 'name_eng is required' }),
        description: z.string({ required_error: 'description is required' })
    })
    const parseResult = categorySchema.safeParse(req.body)
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors
        })
    }
    const sql = 'UPDATE category SET name = ?, name_eng = ?, description = ?, updated_at = ? WHERE id = ?'
    const rows = await query(sql, [req.body.name, req.body.name_eng, req.body.description, moment().format('YYYY-MM-DD HH:mm:ss'), req.params.id])
    return reply.send({
        message: 'success',
        category: rows
    })
}

const deleteCategory = async (req,reply) => {
    const sql = 'DELETE FROM category WHERE id = ?'
    const rows = await query(sql, [req.params.id])
    return reply.send({
        message: 'success',
        category: rows
    })
}

module.exports = {
    getCategoryList,
    getCategoryById,
    addCategory,
    updateCategory,
    deleteCategory
}