import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const initializeSocket = () => {
  if (!socket) {
    const baseURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'
    
    socket = io(baseURL, {
      withCredentials: true
    })

    socket.on('connect', () => {
      console.log('Conectado a Socket.io')
    })

    socket.on('connect_error', (error) => {
      console.error('Error de conexión:', error.message)
    })

    socket.on('disconnect', () => {
      console.log('Desconectado de Socket.io')
    })
  }
  
  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}