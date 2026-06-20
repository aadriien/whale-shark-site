import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
    base: '/',
    plugins: [react()],
    resolve: {
        alias: {
            components: fileURLToPath(new URL('./src/components', import.meta.url)),
            types: fileURLToPath(new URL('./src/types', import.meta.url)),
        },
    },
    build: {
        outDir: 'dist',
    }
})
