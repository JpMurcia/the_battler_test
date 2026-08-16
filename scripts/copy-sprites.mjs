#!/usr/bin/env node
/**
 * specs/021-reskin-cyber-modern (research.md Decisión 5). Copia una sola vez, a mano — nunca desde
 * npm run dev/build — las carpetas 1_idle (16 frames) y 4_attack (12 frames, recuento real y distinto
 * del de idle) de los 12 hero_N asignados en src/data/cats.ts (hero_1..hero_12, spriteKey) desde
 * assets-source/units/Characters/ hacia public/sprites/. El resto de assets-source/ (los otros 18
 * héroes, 2_walk/3_run/5_block/6_die, MonstersCreaturesFantasy2, etc.) queda intacto.
 */
import { mkdir, readdir, copyFile, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const SOURCE_ROOT = path.join(ROOT, 'assets-source', 'units', 'Characters')
const DEST_ROOT = path.join(ROOT, 'public', 'sprites')
const OLD_PLACEHOLDER = path.join(DEST_ROOT, 'cat-placeholder.png')

const HERO_COUNT = 12 // hero_1..hero_12 — coincide con los 12 fixtures de src/data/cats.ts

const ANIMATIONS = [
  { sourceFolder: '1_idle', destFolder: 'idle', expectedFrames: 16 },
  { sourceFolder: '4_attack', destFolder: 'attack', expectedFrames: 12 },
]

function isFramePng(fileName) {
  return /^\d+\.png$/.test(fileName)
}

async function copyHeroAnimation(heroKey, animation) {
  const sourceDir = path.join(SOURCE_ROOT, heroKey, 'male', animation.sourceFolder)
  const destDir = path.join(DEST_ROOT, heroKey, animation.destFolder)

  const entries = await readdir(sourceDir)
  const frames = entries.filter(isFramePng).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))

  if (frames.length !== animation.expectedFrames) {
    throw new Error(
      `${heroKey}/${animation.sourceFolder}: se esperaban ${animation.expectedFrames} frames, se encontraron ${frames.length} en ${sourceDir}`,
    )
  }

  await mkdir(destDir, { recursive: true })
  await Promise.all(frames.map((frame) => copyFile(path.join(sourceDir, frame), path.join(destDir, frame))))

  return frames.length
}

async function main() {
  let totalCopied = 0

  for (let n = 1; n <= HERO_COUNT; n += 1) {
    const heroKey = `hero_${n}`
    for (const animation of ANIMATIONS) {
      const count = await copyHeroAnimation(heroKey, animation)
      totalCopied += count
    }
    console.log(`${heroKey}: idle+attack copiados`)
  }

  const placeholderExists = await stat(OLD_PLACEHOLDER).then(
    () => true,
    () => false,
  )
  if (placeholderExists) {
    await rm(OLD_PLACEHOLDER)
    console.log('cat-placeholder.png eliminado (reemplazado por public/sprites/hero_N/)')
  }

  console.log(`Listo — ${totalCopied} archivos copiados hacia ${path.relative(ROOT, DEST_ROOT)}`)
}

main().catch((error) => {
  console.error('copy-sprites falló:', error.message)
  process.exitCode = 1
})
