const productController = require('../controllers/product')
const ordersController = require('../controllers/orders')
const reportController = require('../controllers/report/orders')
const loginController = require('../controllers/login/login')
const usersController = require('../controllers/users/users')
const addressesController = require('../controllers/users/addresses')
const categoryController = require('../controllers/category')


async function routes(fastify, options, next) {
  fastify.get('/', async (request, reply) => {
    return {
      hello: 'world !! this is my api',
      version: '1.0.0'
    }
  })

  // เกี่ยวกับ product
  fastify.get('/product', productController.getProductList)

  fastify.get('/product/:id', {
    onRequest: [fastify.authenticate]
  }, (req,reply) => {
    productController.getProductById(req,reply,fastify)
  })
  fastify.post('/product', {
    onRequest: [fastify.authenticate]
  }, (req,reply) => {
    productController.addProduct(req,reply,fastify)
  })
  fastify.put('/product/:id', {
    onRequest: [fastify.authenticate]
  }, (req,reply) => {
    productController.updateProduct(req,reply,fastify)
  })
  fastify.delete('/product/:id', {
    onRequest: [fastify.authenticate]
  }, (req,reply) => {
    productController.deleteProduct(req,reply,fastify)
  })
  fastify.get('/product-category/:category_id', productController.getProductListByCategoryId)
  

  // เกี่ยวกับ orders
  fastify.get('/orders', ordersController.getOrdersList)
  fastify.get('/orders/:id', ordersController.getOrdersById)
  fastify.post('/orders', ordersController.addOrders)
  // fastify.put('/orders/:id', ordersController.updateOrders)
  fastify.delete('/orders/:id', ordersController.deleteOrders)

  //report ใบเสร็จ
  fastify.get('/report/orders', reportController.getOrdersReport)
  fastify.get('/report/orders/:id', reportController.getOrdersReportById)

  // เกี่ยวกับ users
  fastify.get('/users', usersController.getUsersList)
  fastify.get('/users/:id', usersController.getUsersById)
  fastify.post('/users', usersController.addUsers)
  fastify.put('/users/:id', {
    onRequest: [fastify.authenticate]
  }, (req,reply) => {
    usersController.updateUsers(req,reply,fastify)
  })
  fastify.delete('/users/:id', usersController.deleteUsers)

  // เกี่ยวกับ addresses
  fastify.get('/addresses', addressesController.getAddressesList)
  fastify.get('/addresses/:id', addressesController.getAddressesById)
  fastify.post('/addresses', addressesController.addAddresses)
  fastify.put('/addresses/:id', addressesController.updateAddresses)
  fastify.delete('/addresses/:id', addressesController.deleteAddresses)

  // login
  fastify.post('/login', loginController.login)

  // เกี่ยวกับ category  
  fastify.get('/category', categoryController.getCategoryList)
  fastify.get('/category/:id', categoryController.getCategoryById)
  fastify.post('/category', categoryController.addCategory)
  fastify.put('/category/:id', categoryController.updateCategory)
  fastify.delete('/category/:id', categoryController.deleteCategory)


  next()
}

module.exports = routes
