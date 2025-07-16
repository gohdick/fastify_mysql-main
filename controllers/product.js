const moment = require('moment'); 
const { query } = require('../config/db');
const { z } = require('zod');
const fs = require('fs');
const path = require('path');

const getProductList = async (req,reply) => {
    const sql = 'SELECT * FROM product'
    const rows = await query(sql)
    return reply.send(rows)
}

const getProductListByCategoryId = async (req,reply) => {
    // console.log('req',req.params)

    const category_id =  parseInt(req.params.category_id)
    const categorySchema = z.object({
        category_id: z.number({ required_error: 'category_id is required' })
    })
    const parseResult = categorySchema.safeParse({category_id: category_id})
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors
        })
    }

    const sql = 'SELECT * FROM product WHERE category_id = ?'
    const rows = await query(sql, [parseResult.data.category_id])
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
        images: z.string({ required_error: 'images is required' }), // เปลี่ยนจาก image_url เป็น images
        alcohol_percent: z.number({ required_error: 'alcohol_percent is required' }),
        volume: z.number({ required_error: 'volume is required' }),
        country: z.string({ required_error: 'country is required' }),
        year: z.number({ required_error: 'year is required' }),
        created_at: z.string({ required_error: 'created_at is required' })
    });

    // Validate req.body
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors
        });
    }
    
    // สร้างโฟลเดอร์ถ้ายังไม่มี
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'wies');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // แปลง base64 เป็นไฟล์
    let image_url = '';
    try {
        // แยกส่วน header และ data ของ base64
        const matches = req.body.images.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return reply.status(400).send({ message: 'รูปแบบ base64 ไม่ถูกต้อง' });
        }

        // ดึงประเภทของไฟล์จาก MIME type และ base64 data
        const imageType = matches[1];
        const base64Data = matches[2];

        // กำหนดนามสกุลไฟล์ตาม MIME type
        let extension = 'png'; // ค่าเริ่มต้น
        if (imageType === 'image/jpeg' || imageType === 'image/jpg') {
            extension = 'jpg';
        } else if (imageType === 'image/gif') {
            extension = 'gif';
        } else if (imageType === 'image/png') {
            extension = 'png';
        } else if (imageType === 'image/webp') {
            extension = 'webp';
        }
        
        // สร้างชื่อไฟล์ที่ไม่ซ้ำกันพร้อมนามสกุลที่ถูกต้อง
        const fileName = `wine_${Date.now()}.${extension}`;
        const filePath = path.join(uploadDir, fileName);
        
        // เขียนไฟล์
        fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
        
        // กำหนด URL สำหรับเข้าถึงรูปภาพ
        image_url = `/public/uploads/wies/${fileName}`;
    } catch (error) {
        console.error('Error saving image:', error);
        return reply.status(500).send({ message: 'เกิดข้อผิดพลาดในการบันทึกรูปภาพ' });
    }

    // If validation passes, continue
    const sql = 'INSERT INTO product (name, price, description, stock, category_id, image_url, alcohol_percent, volume, country, year, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    const rows = await query(sql, [req.body.name, req.body.price, req.body.description, req.body.stock, req.body.category_id, image_url, req.body.alcohol_percent, req.body.volume, req.body.country, req.body.year, moment().format('YYYY-MM-DD HH:mm:ss')])
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

const updateProduct = async (req, reply, fastify) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = fastify.jwt.decode(token);
    if (decoded.role_id !== 1) {
        return reply.status(401).send({ message: 'คุณไม่ใช่ admin' });
    }

    const [oldProduct] = await query('SELECT * FROM product WHERE id = ?', [req.params.id]);
    if (!oldProduct) {
        return reply.code(404).send({ message: 'ไม่พบสินค้า' });
    }

    const productSchema = z.object({
        name: z.string({ required_error: 'name is required' }),
        price: z.number({ required_error: 'price is required' }),
        description: z.string({ required_error: 'description is required' }),
        stock: z.number({ required_error: 'stock is required' }),
        category_id: z.number({ required_error: 'category_id is required' }),
        images: z.string().optional(), // อนุญาตให้ไม่ส่งก็ได้
        alcohol_percent: z.number({ required_error: 'alcohol_percent is required' }),
        volume: z.number({ required_error: 'volume is required' }),
        country: z.string({ required_error: 'country is required' }),
        year: z.number({ required_error: 'year is required' }),
        updated_at: z.string({ required_error: 'updated_at is required' }),
    });
    
    // Validate req.body
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
        return reply.status(400).send({
            message: 'Validation failed',
            errors: parseResult.error.errors,
        });
    }

    // จัดการรูปภาพใหม่ ถ้ามีส่งมา
    let image_url = oldProduct.image_url;
    if (req.body.images && req.body.images.startsWith('data:')) {
        // ตรวจสอบว่ารูปภาพที่ส่งมาเหมือนกับรูปภาพเดิมหรือไม่
        let skipImageUpdate = false;
        
        if (oldProduct.image_url) {
            try {
                // ตรวจสอบว่าไฟล์รูปภาพเดิมมีอยู่จริงหรือไม่
                const oldImagePath = path.join(__dirname, '..', oldProduct.image_url.replace('/public', 'public'));
                if (fs.existsSync(oldImagePath)) {
                    // อ่านไฟล์รูปภาพเดิมเป็น base64
                    const oldImageData = fs.readFileSync(oldImagePath, { encoding: 'base64' });
                    
                    // เปรียบเทียบ base64 ของรูปภาพเดิมกับรูปภาพใหม่
                    const newImageBase64 = req.body.images.split(',')[1];
                    if (oldImageData === newImageBase64) {
                        skipImageUpdate = true; // รูปภาพเหมือนกัน ไม่ต้องอัพเดท
                        console.log('รูปภาพเหมือนเดิม ข้ามการอัพเดทรูปภาพ');
                    }
                }
            } catch (error) {
                console.error('Error comparing images:', error);
                // ถ้าเกิดข้อผิดพลาดในการเปรียบเทียบ ให้อัพเดทรูปภาพใหม่ตามปกติ
            }
        }
        
        if (!skipImageUpdate) {
            // อัพโหลดรูปภาพใหม่
            const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'wies');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            try {
                const matches = req.body.images.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
                if (!matches || matches.length !== 3) {
                    return reply.status(400).send({ message: 'รูปแบบ base64 ไม่ถูกต้อง' });
                }

                const imageType = matches[1];
                const base64Data = matches[2];

                let extension = 'png';
                if (imageType === 'image/jpeg' || imageType === 'image/jpg') extension = 'jpg';
                else if (imageType === 'image/gif') extension = 'gif';
                else if (imageType === 'image/webp') extension = 'webp';

                const fileName = `wine_${Date.now()}.${extension}`;
                const filePath = path.join(uploadDir, fileName);

                fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
                image_url = `/public/uploads/wies/${fileName}`;
            } catch (error) {
                console.error('Error saving image:', error);
                return reply.status(500).send({ message: 'เกิดข้อผิดพลาดในการบันทึกรูปภาพ' });
            }
        }
    }

    const {
        name,
        price,
        description,
        stock,
        category_id,
        alcohol_percent,
        volume,
        country,
        year,
    } = req.body;

    const updated_at = moment().format('YYYY-MM-DD HH:mm:ss');

    const sql = `UPDATE product SET 
        name = ?, price = ?, description = ?, stock = ?, category_id = ?, 
        image_url = ?, alcohol_percent = ?, volume = ?, country = ?, year = ?, updated_at = ?
        WHERE id = ?`;

    const rows = await query(sql, [
        name, price, description, stock, category_id, image_url,
        alcohol_percent, volume, country, year,
        updated_at, req.params.id,
    ]);

    if (rows.affectedRows > 0) {
        return reply.send({ message: 'อัปเดตสินค้าสำเร็จ', product: rows });
    } else {
        return reply.send({ message: 'อัปเดตสินค้าไม่สำเร็จ', product: rows });
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

    if(rows.image_url){
        const imagePath = path.join(__dirname, '..', rows.image_url.replace('/public', 'public'));
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }
    
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
    deleteProduct,
    getProductListByCategoryId
}