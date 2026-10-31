-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_movimientos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "fuente_id" TEXT,
    "deuda_id" TEXT,
    "gasto_id" TEXT,
    "descripcion" TEXT,
    "monto" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimientos_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuentes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_deuda_id_fkey" FOREIGN KEY ("deuda_id") REFERENCES "deudas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_gasto_id_fkey" FOREIGN KEY ("gasto_id") REFERENCES "gastos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_movimientos" ("descripcion", "deuda_id", "fecha", "fuente_id", "id", "monto", "tipo") SELECT "descripcion", "deuda_id", "fecha", "fuente_id", "id", "monto", "tipo" FROM "movimientos";
DROP TABLE "movimientos";
ALTER TABLE "new_movimientos" RENAME TO "movimientos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
