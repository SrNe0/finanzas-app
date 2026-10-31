import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Crea el archivo de entorno a partir del ejemplo, sin pisar uno existente. Devuelve true si lo creó. */
export function asegurarEnv(origen, destino) {
  if (existsSync(destino)) return false
  copyFileSync(origen, destino)
  return true
}

const esteArchivo = fileURLToPath(import.meta.url)

if (process.argv[1] && path.resolve(process.argv[1]) === esteArchivo) {
  const raizApi = path.resolve(path.dirname(esteArchivo), '..')
  if (asegurarEnv(path.join(raizApi, '.env.example'), path.join(raizApi, '.env'))) {
    console.log('Se creó apps/api/.env a partir de apps/api/.env.example')
  }
}
