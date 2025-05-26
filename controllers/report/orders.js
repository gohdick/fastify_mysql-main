const moment = require('moment');
const { query } = require('../../config/db');


const getOrdersReport = async (req, reply) => {
    const sqlOrders = 'SELECT * FROM orders'
    const sqlOrderItems = 'SELECT * FROM order_items WHERE order_id = ?'
    const rowsOrders = await query(sqlOrders)
    await Promise.all(rowsOrders.map(async row => {
        row.order_items = await query(sqlOrderItems, [row.id])
    }))
    return reply.send(rowsOrders)
}

const getOrdersReportById = async (req,reply) => {
    const sqlOrders = 'SELECT * FROM orders WHERE id = ?'
    const sqlOrderItems = 'SELECT * FROM order_items WHERE order_id = ?'
    const rowsOrders = await query(sqlOrders, [req.params.id])
    rowsOrders[0].order_items = await query(sqlOrderItems, [req.params.id])
    if (rowsOrders.length > 0) {
        return reply.send({
            message: 'ค้นหา orders สำเร็จ',
            orders: rowsOrders[0]
        })
    } else {
        return reply.send({
            message: 'ไม่พบ orders',
            orders: rowsOrders[0]
        })
    }
}

module.exports = {
    getOrdersReport,
    getOrdersReportById
}
