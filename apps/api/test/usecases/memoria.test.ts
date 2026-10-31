import { describe, expect, it } from 'vitest'
import { crearMemoria } from '../helpers/memoria'

describe('unidad de trabajo en memoria', () => {
  it('revierte las escrituras si el trabajo lanza un error', async () => {
    const m = crearMemoria()
    const fuente = m.agregarFuente('Cuenta', 10_000)

    await expect(
      m.uow.run(async repos => {
        const f = await repos.fuentes.findById(fuente.id)
        f!.depositar(5_000)
        await repos.fuentes.update(f!)
        await repos.fuentes.save({ ...fuente, id: '' } as typeof fuente)
        throw new Error('falla')
      })
    ).rejects.toThrow('falla')

    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(10_000)
    expect(m.datos.fuentes.size).toBe(1)
  })

  it('conserva las escrituras si el trabajo termina bien', async () => {
    const m = crearMemoria()
    const fuente = m.agregarFuente('Cuenta', 10_000)

    await m.uow.run(async repos => {
      const f = await repos.fuentes.findById(fuente.id)
      f!.depositar(5_000)
      await repos.fuentes.update(f!)
    })

    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(15_000)
  })

  it('cada lectura devuelve una copia: modificarla no cambia lo guardado hasta hacer update', async () => {
    const m = crearMemoria()
    const fuente = m.agregarFuente('Cuenta', 10_000)

    const lectura = await m.repos.fuentes.findById(fuente.id)
    lectura!.depositar(1_000)

    expect(m.datos.fuentes.get(fuente.id)?.saldo).toBe(10_000)
  })
})
