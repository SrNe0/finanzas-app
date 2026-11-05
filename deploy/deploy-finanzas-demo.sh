#!/usr/bin/env bash
# Despliegue de la DEMO PÚBLICA de Finanzas en el servidor, con comprobación de salud y rollback.
#
# Se instala como /usr/local/sbin/deploy-finanzas-demo (root:root, 0755). NO se ejecuta
# desde el repo: el usuario "deploy" solo puede lanzarlo vía sudo, y como el archivo es de root,
# un cambio en el repo no puede alterar lo que corre con privilegios.
#
# El clon de la demo (~/demos/finanzas-demo) es independiente de ~/Projects/finanzas-app,
# donde puede haber datos reales: este script nunca toca esa carpeta.
#
# Uso: deploy-finanzas-demo <sha-de-40-caracteres>
set -euo pipefail

SHA="${1:-}"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "uso: deploy-finanzas-demo <sha de 40 caracteres>" >&2; exit 2; }

APP=/home/srne0/demos/finanzas-demo
OWNER=srne0

# Un solo despliegue a la vez
exec 9>/var/lock/deploy-finanzas-demo.lock
flock -n 9 || { echo "ya hay un despliegue en curso" >&2; exit 4; }

[ -d "$APP/.git" ] || { echo "no existe el clon de la demo en $APP" >&2; exit 5; }

git_()    { sudo -u "$OWNER" git -C "$APP" "$@"; }
compose() { docker compose --project-directory "$APP" -f "$APP/compose.demo.yaml" "$@"; }

# Espera a que los dos servicios (api y web) estén healthy
healthy() {
  local servicio cid status ok
  for _ in $(seq 1 60); do
    ok=1
    for servicio in api web; do
      cid=$(compose ps -q "$servicio" 2>/dev/null || true)
      status=""
      [ -n "$cid" ] && status=$(docker inspect -f '{{.State.Health.Status}}' "$cid" 2>/dev/null || true)
      [ "$status" = "healthy" ] || ok=0
    done
    [ "$ok" = 1 ] && return 0
    sleep 5
  done
  return 1
}

PREV=$(git_ rev-parse HEAD)
echo ">> actual: ${PREV:0:7}   nuevo: ${SHA:0:7}"

git_ fetch --quiet origin main
# Solo se despliegan commits que ya están en origin/main (es decir, que pasaron por la PR y el CI)
git_ merge-base --is-ancestor "$SHA" origin/main || { echo "el commit no está en origin/main" >&2; exit 3; }

git_ checkout --quiet main
git_ merge --ff-only --quiet "$SHA"

if compose up -d --build && healthy; then
  echo ">> desplegado OK: ${SHA:0:7}"
  docker image prune -f >/dev/null 2>&1 || true
  exit 0
fi

echo ">> FALLÓ el despliegue; rollback a ${PREV:0:7}" >&2
git_ reset --hard --quiet "$PREV"
compose up -d --build || true
if healthy; then
  echo ">> rollback OK" >&2
else
  echo ">> ATENCIÓN: el rollback tampoco quedó saludable" >&2
fi
exit 1
