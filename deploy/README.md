# Demo pública

La demo corre en un servidor propio, detrás de un Cloudflare Tunnel, con **datos ficticios**. La app normal sigue
siendo de uso local y sin autenticación: la demo no comparte nada con ella.

## Cómo está aislada

- La base de la demo es `/tmp/demo.db` **dentro del contenedor** (sin volúmenes). `.dockerignore` excluye `apps/data`,
  `*.db` y `.env`, y `demo-run.mjs` aborta si `DATABASE_URL` no apunta a `/tmp`.
- Al arrancar, `apps/api/scripts/demo-run.mjs` rehace la base, aplica migraciones y ejecuta el seed de demo (las fechas
  son relativas a hoy).
- A las 04:00 hora de Bogotá el proceso termina y Docker reinicia el contenedor: los datos vuelven a empezar limpios.

## Piezas

| Archivo | Qué hace |
| --- | --- |
| `Dockerfile` | Imágenes `api` (API + seed + reinicio nocturno) y `web` (nginx con la web compilada) |
| `compose.demo.yaml` | Une ambas: nginx comparte la red de la API, que sigue escuchando solo en `127.0.0.1` |
| `deploy/nginx.conf` | Estáticos, proxy de `/api`, tope de 16 KB y límite de ritmo en peticiones que escriben |
| `apps/web/.../DemoBanner.tsx` | Aviso de demo compartida; solo aparece si se compila con `VITE_DEMO_BANNER` |
| `deploy/deploy-finanzas-demo.sh` | Script del servidor: despliega un commit de `main`, comprueba salud y hace rollback |

## Despliegue continuo

Cada `push` a `main` con el CI en verde ejecuta el job `deploy-demo`: entra a la tailnet con la etiqueta `tag:ci`,
conecta por Tailscale SSH como el usuario `deploy` y ejecuta `deploy-finanzas-demo <sha>`.

`deploy-finanzas-demo.sh` se instala **a mano** en `/usr/local/sbin/` (propiedad de root). Si lo cambias, reinstálalo.

```bash
sudo install -m 0755 -o root -g root deploy/deploy-finanzas-demo.sh /usr/local/sbin/deploy-finanzas-demo
```

## Ejecutar la demo en local

```bash
docker compose -f compose.demo.yaml up -d --build
# http://127.0.0.1:8091
```
