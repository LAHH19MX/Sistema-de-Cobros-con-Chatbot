import { Server as HTTPServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import jwt from 'jsonwebtoken'

let io: SocketServer

export const initializeSocket = (server: HTTPServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true
    }
  })

  // Middleware de autenticación
  io.use(async (socket, next) => {
    try {
      const cookieString = socket.handshake.headers.cookie || ''
      
      const tokenMatch = cookieString.match(/token=([^;]+)/)
      const token = tokenMatch ? tokenMatch[1] : null
      
      if (!token) {
        return next(new Error('No token in cookies'))
      }

      // Verificar token
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET as string) as any
      
      socket.data.userId = decoded.id
      socket.data.userRole = decoded.rol
      
      if (decoded.rol !== 'inquilino') {
        return next(new Error('Access denied - inquilinos only'))
      }
      
      next()
    } catch (error) {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId
    console.log(`Inquilino conectado: ${userId}`)
    
    socket.join(`inquilino:${userId}`)
    
    socket.on('disconnect', () => {
      console.log(`Inquilino desconectado: ${userId}`)
    })
  })

  return io
}

export const getIO = () => io

export const emitToInquilino = (inquilinoId: string, event: string, data: any) => {
  if (io) {
    io.to(`inquilino:${inquilinoId}`).emit(event, data)
  }
}