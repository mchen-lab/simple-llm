
import path from "path"
import { fileURLToPath } from "url"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import fs from 'fs'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'))

// Generate default dev metadata if not provided
const buildMetadata = process.env.BUILD_METADATA || `-dev-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

// Attempt to get git commit hash
let commitHash = process.env.GIT_COMMIT;
if (!commitHash) {
  try {
    commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    commitHash = 'unknown';
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify(packageJson.version + buildMetadata),
    '__COMMIT_HASH__': JSON.stringify(commitHash),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    proxy: {
      '/api': 'http://localhost:31161',
    }
  }
})
