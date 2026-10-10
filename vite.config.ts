import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    // Vitest sustituye por '' cualquier .css que no procesa, incluso con `?raw`. tests/unit/theme/designTokens.test.ts
    // lee theme.css/index.css como texto (`?raw`) para hacer cumplir la política de tokens: solo esos imports se procesan.
    css: { include: [/\.css\?raw$/] },
    // `.claude/worktrees/` guarda copias antiguas del repo (worktrees de la app de escritorio) — sus tests
    // no son parte de este proyecto y duplicaban/inflaban el conteo de `npm test`.
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
})
