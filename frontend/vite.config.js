import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Serve the demo/ folder at /demo/* without moving it into the project
    {
      name: 'serve-demo-folder',
      configureServer(server) {
        server.middlewares.use('/demo', (req, res, next) => {
          const demoDir = path.resolve(__dirname, '../demo')
          const filePath = path.join(demoDir, req.url === '/' ? '/index.html' : req.url)
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type',
              filePath.endsWith('.js') ? 'application/javascript' :
              filePath.endsWith('.css') ? 'text/css' : 'text/html'
            )
            fs.createReadStream(filePath).pipe(res)
          } else {
            next()
          }
        })
      },
    },
  ],
  server: {
    host: 'localhost',
    port: 5173,
    fs: {
      // Allow Vite to serve files from outside the project root
      allow: ['..'],
    },
    proxy: {
      // Proxy /api/* → http://localhost:4000/api/*
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
