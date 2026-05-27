-- CreateTable
CREATE TABLE "deudas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "saldo" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "mes" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "fuentes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "saldo" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "movimientos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "fuente_id" TEXT,
    "deuda_id" TEXT,
    "descripcion" TEXT,
    "monto" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimientos_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuentes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimientos_deuda_id_fkey" FOREIGN KEY ("deuda_id") REFERENCES "deudas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "mes" TEXT NOT NULL,
    "fuente_id" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gastos_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuentes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
