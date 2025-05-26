const fastify = require('fastify')({
    debug: false
})

fastify.register(require('fastify-jwt'), {
    secret: 'my-secret-key_123'
})

const routes = require('./routes')

fastify.register(require('@fastify/formbody'))

fastify.register(require('@fastify/cors'), { 
    
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    methods: ['GET', 'PUT', 'POST', 'DELETE'],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false

  })
  
  fastify.decorate("authenticate", async function(request, reply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

fastify.register(routes)


fastify.listen(3000, '0.0.0.0', err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})