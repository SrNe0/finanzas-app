export class Gasto {
  constructor(
    public readonly id: string | null,
    public descripcion: string,
    public categoria: string,
    public monto: number,
    public mes: string,
    public fuenteId: string | null,
    public fecha: Date
  ) {}
}
