import { spawn, spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Arranque de la DEMO PÚBLICA (solo dentro del contenedor de la demo).
 *
 * 1. Rehace una base SQLite vacía en /tmp, aplica las migraciones y siembra datos ficticios
 *    (el seed usa fechas relativas a hoy, por eso se hace en cada arranque y no al compilar la imagen).
 * 2. Lanza la API.
 * 3. A las 04:00 (hora de Bogotá) termina el proceso con código 0: Docker reinicia el contenedor
 *    (restart: unless-stopped) y todo vuelve a empezar con datos limpios.
 */

const esteArchivo = fileURLToPath(import.meta.url)
const raizApi = path.resolve(path.dirname(esteArchivo), '..')
const bin = nombre => path.join(raizApi, 'node_modules', '.bin', nombre)

// Bogotá no tiene horario de verano (UTC-5 fijo): las 04:00 locales son las 09:00 UTC.
const HORA_REINICIO_UTC = 9
const UN_MINUTO = 60_000
const UN_DIA = 24 * 60 * UN_MINUTO

/** Milisegundos hasta la próxima hora de reinicio. */
export function msHastaReinicio(ahora = new Date()) {
  const objetivo = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate(), HORA_REINICIO_UTC)
  const falta = objetivo - ahora.getTime()
  // Margen de un minuto para no reiniciar dos veces seguidas si arranca justo a esa hora
  return falta > UN_MINUTO ? falta : falta + UN_DIA
}

/** Ruta del archivo SQLite, o null si la URL no apunta a una base desechable en /tmp. */
export function archivoBaseDemo(url) {
  return typeof url === 'string' && url.startsWith('file:/tmp/') ? url.slice('file:'.length) : null
}

function ejecutar(comando, args) {
  const r = spawnSync(comando, args, { cwd: raizApi, stdio: 'inherit' })
  if (r.status !== 0) {
    console.error(`demo-run: falló "${path.basename(comando)} ${args.join(' ')}"`)
    process.exit(r.status ?? 1)
  }
}

function main() {
  // Seguro de vida: esta demo solo puede tocar una base desechable dentro de /tmp, nunca una base real.
  const archivoBase = archivoBaseDemo(process.env.DATABASE_URL)
  if (!archivoBase) {
    console.error(
      `demo-run: DATABASE_URL debe apuntar a /tmp (valor actual: "${process.env.DATABASE_URL}"). Se aborta.`
    )
    process.exit(1)
  }

  for (const sufijo of ['', '-journal']) rmSync(archivoBase + sufijo, { force: true })

  ejecutar(bin('prisma'), ['migrate', 'deploy'])
  ejecutar(bin('tsx'), ['prisma/seed-demo.ts'])

  let reinicioNocturno = false
  const api = spawn(bin('tsx'), ['src/index.ts'], { cwd: raizApi, stdio: 'inherit' })
  api.on('exit', codigo => process.exit(reinicioNocturno ? 0 : (codigo ?? 1)))

  const espera = msHastaReinicio()
  console.log(`demo-run: reinicio nocturno en ${Math.round(espera / UN_MINUTO)} minutos`)
  setTimeout(() => {
    console.log('demo-run: reinicio nocturno, se restablecen los datos de la demo')
    reinicioNocturno = true
    api.kill('SIGTERM')
    setTimeout(() => process.exit(0), 5_000).unref()
  }, espera)

  for (const senal of ['SIGTERM', 'SIGINT']) process.on(senal, () => api.kill(senal))
}

if (process.argv[1] && path.resolve(process.argv[1]) === esteArchivo) main()
