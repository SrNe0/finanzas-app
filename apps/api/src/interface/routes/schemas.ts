import { z } from 'zod'

/** Mes en formato AAAA-MM, con el mes entre 01 y 12. */
export const MesSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'El mes debe tener el formato AAAA-MM (mes entre 01 y 12)')
