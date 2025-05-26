const moment = require('moment');
const { query } = require('../config/db');
const { z } = require('zod');

const getOrdersList = async (req,reply) => {
    const sql = 'SELECT * FROM orders'
    const rows = await query(sql)
    return reply.send(rows)
}

const getOrdersById = async (req,reply) => {
    const sql = 'SELECT * FROM orders WHERE id = ?'
    const rows = await query(sql, [req.params.id])
    if (rows.length > 0) {
        return reply.send({
            message: 'ค้นหา orders สำเร็จ',
            orders: rows
        })
    } else {
        return reply.send({
            message: 'ไม่พบ orders',
            orders: rows
        })
    }
}

const addOrders = async (req,reply) => {
    // แสดงข้อมูลที่ส่งมาจาก client
    // console.log(req.body)

    // Zod schema for validation
    const orderItemSchema = z.object({
        product_id: z.number({ required_error: 'product_id is required' }),
        quantity: z.number({ required_error: 'quantity is required' }),
        price: z.number({ required_error: 'price is required' })
    });
    const orderSchema = z.object({
        user_id: z.number({ required_error: 'user_id is required' }),
        receipt_number: z.string({ required_error: 'receipt_number is required' }),
        total_price: z.number({ required_error: 'total_price is required' }),
        order_status_id: z.number({ required_error: 'order_status_id is required' }),
        order_items: z.array(orderItemSchema)
    });

    // Validate req.body
    const parseResult = orderSchema.safeParse(req.body);
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors
        });
    }

    // If validation passes, continue
    const sql = 'INSERT INTO orders (user_id, receipt_number, total_price, order_status_id, created_at) VALUES (?, ?, ?, ?, ?)'

    const rows = await query(sql, [req.body.user_id, req.body.receipt_number, req.body.total_price, req.body.order_status_id, moment().format('YYYY-MM-DD HH:mm:ss')])
    // แสดงหมายเลขที่เพิ่มใหม่
    // console.log(rows.insertId)
    const order_id = rows.insertId
    const order_items = req.body.order_items
    const resultOrderItems = []
    for (const order_item of order_items) {
        const sqlOrderItem = 'INSERT INTO order_items (order_id, product_id, quantity, price, created_at) VALUES (?, ?, ?, ?, ?)'
        const rowsOrderItem = await query(sqlOrderItem, [order_id, order_item.product_id, order_item.quantity, order_item.price, moment().format('YYYY-MM-DD HH:mm:ss')])
        resultOrderItems.push(rowsOrderItem)
    }

    if (rows.affectedRows > 0) {
        return reply.send({
            message: 'เพิ่ม orders สำเร็จ',
            orders: rows,
            order_items: resultOrderItems
        })
    } else {
        return reply.send({
            message: 'เพิ่ม orders ไม่สำเร็จ',
            orders: rows,
            order_items: resultOrderItems
        })
    }
}


const deleteOrders = async (req, reply) => {
    // ลบ order_items ก่อน
    const sqlOrderItems = 'DELETE FROM order_items WHERE order_id = ?';
    await query(sqlOrderItems, [req.params.id]);

    // ลบ orders
    const sqlOrders = 'DELETE FROM orders WHERE id = ?';
    const rows = await query(sqlOrders, [req.params.id]);

    if (rows.affectedRows > 0) {
        return reply.send({
            message: 'ลบ orders สำเร็จ',
            orders: rows
        });
    } else {
        return reply.send({
            message: 'ลบ orders ไม่สำเร็จ',
            orders: rows
        });
    }
}

module.exports = { 
    getOrdersList , 
    getOrdersById,
    addOrders,
    deleteOrders
}