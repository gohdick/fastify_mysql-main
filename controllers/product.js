const moment = require('moment'); 
const { query } = require('../config/db');
const { z } = require('zod');

const getProductList = async (req,reply,fastify) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = fastify.jwt.decode(token)
    // console.log(decoded)
    if(decoded.role_id !== 1){
        return reply.status(401).send({ message: 'คุณไม่ใช่ admin' })
    }
    const sql = 'SELECT * FROM product'
    const rows = await query(sql)
    return reply.send(rows)
}

const getProductById = async (req,reply,fastify) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = fastify.jwt.decode(token)
    // console.log(decoded)
    if(decoded.role_id !== 1){
        return reply.status(401).send({ message: 'คุณไม่ใช่ admin' })
    }
    const sql = 'SELECT * FROM product WHERE id = ?'
    const rows = await query(sql, [req.params.id])
    if (rows.length > 0) {
        return reply.send({
            message: 'ค้นหาสินค้าสำเร็จ',
            product: rows
        })
    } else {
        return reply.send({
            message: 'ไม่พบสินค้า',
            product: rows
        })
    }
}

const addProduct = async (req,reply,fastify) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = fastify.jwt.decode(token)
    // console.log(decoded)
    if(decoded.role_id !== 1){
        return reply.status(401).send({ message: 'คุณไม่ใช่ admin' })
    }
    // แสดงข้อมูลที่ส่งมาจาก client
    // console.log(req.body)

    // Zod schema for validation
    const productSchema = z.object({
        name: z.string({ required_error: 'name is required' }),
        price: z.number({ required_error: 'price is required' }),
        description: z.string({ required_error: 'description is required' }),
        stock: z.number({ required_error: 'stock is required' }),
        category_id: z.number({ required_error: 'category_id is required' }),
        image_url: z.string({ required_error: 'image_url is required' })
    });

    // Validate req.body
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors
        });
    }

    // If validation passes, continue
    const sql = 'INSERT INTO product (name, price, description, stock, category_id, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    const rows = await query(sql, [req.body.name, req.body.price, req.body.description, req.body.stock, req.body.category_id, req.body.image_url, moment().format('YYYY-MM-DD HH:mm:ss')])
    if (rows.affectedRows > 0) {
        return reply.send({
            message: 'เพิ่มสินค้าสำเร็จ',
            product: rows
        })
    } else {
        return reply.send({
            message: 'เพิ่มสินค้าไม่สำเร็จ',
            product: rows
        })
    }
}


const updateProduct = async (req, reply,fastify) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = fastify.jwt.decode(token)
    // console.log(decoded)
    if(decoded.role_id !== 1){
        return reply.status(401).send({ message: 'คุณไม่ใช่ admin' })
    }
    // ดึงข้อมูลเดิมมาก่อน
    const [oldProduct] = await query('SELECT * FROM product WHERE id = ?', [req.params.id]);
    if (!oldProduct) {
        return reply.code(404).send({ message: 'ไม่พบสินค้า' });
    }

    // Zod schema for validation
    const productSchema = z.object({
        name: z.string({ required_error: 'name is required' }),
        price: z.number({ required_error: 'price is required' }),
        description: z.string({ required_error: 'description is required' }),
        stock: z.number({ required_error: 'stock is required' }),
        category_id: z.number({ required_error: 'category_id is required' }),
        image_url: z.string({ required_error: 'image_url is required' })
    });

    // Validate req.body
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors
        });
    }

    // ใช้ค่าจาก body ถ้ามี ถ้าไม่มีใช้ค่าจาก oldProduct
    const name = req.body.name ?? oldProduct.name;
    const price = req.body.price ?? oldProduct.price;
    const description = req.body.description ?? oldProduct.description;
    const stock = req.body.stock ?? oldProduct.stock;
    const category_id = req.body.category_id ?? oldProduct.category_id;
    const image_url = req.body.image_url ?? oldProduct.image_url;

    const sql = 'UPDATE product SET name = ?, price = ?, description = ?, stock = ?, category_id = ?, image_url = ?, updated_at = ? WHERE id = ?';
    const rows = await query(sql, [
        name, price, description, stock, category_id, image_url,
        moment().format('YYYY-MM-DD HH:mm:ss'),
        req.params.id
    ]);
    if (rows.affectedRows > 0) {
        return reply.send({
            message: 'อัปเดตสินค้าสำเร็จ',
            product: rows
        });
    } else {
        return reply.send({
            message: 'อัปเดตสินค้าไม่สำเร็จ',
            product: rows
        });
    }
}

const deleteProduct = async (req,reply,fastify) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = fastify.jwt.decode(token)
    // console.log(decoded)
    if(decoded.role_id !== 1){
        return reply.status(401).send({ message: 'คุณไม่ใช่ admin' })
    }
    const sql = 'DELETE FROM product WHERE id = ?'
    const rows = await query(sql, [req.params.id])
    if (rows.affectedRows > 0) {
        return reply.send({
            message: 'ลบสินค้าสำเร็จ',
            product: rows
        })
    } else {
        return reply.send({
            message: 'ลบสินค้าไม่สำเร็จ',
            product: rows
        })
    }
}

module.exports = { 
    getProductList , 
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct
}