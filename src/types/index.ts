export interface ProductoInversion {
  _id?: string;
  nombre: string;
  precio_compra: number; // Inversión
  precio_venta: number;  // Lo que cobras
  stock_actual: number;
  unidades_vendidas: number;
}