import { buildApp, HOST, PORT } from './app'
import { buildContainer } from './shared/container'

async function start() {
  const app = await buildApp(buildContainer())
  await app.listen({ port: PORT, host: HOST })
}

start().catch(console.error)
