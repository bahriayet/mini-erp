export interface StockState {
  quantity: number
  reserved: number
}

/**
 * Menghitung kuantitas stok yang tersedia (bebas dijual / ditransfer)
 * Kuantitas Tersedia = Kuantitas Fisik - Kuantitas Terkunci (Reserved)
 */
export function calculateAvailableStock(state: StockState): number {
  const available = state.quantity - state.reserved
  return Math.max(0, available) // Mencegah nilai negatif yang tidak logis
}

/**
 * Mengevaluasi apakah suatu transaksi mutasi atau transfer stok valid dilakukan
 * - IN: Selalu diperbolehkan jika kuantitas positif
 * - OUT: Hanya diperbolehkan jika kuantitas tersedia mencukupi
 */
export function canMutateStock(
  state: StockState,
  type: "IN" | "OUT" | "TRANSFER",
  amount: number
): boolean {
  if (amount <= 0) return false

  if (type === "IN") return true

  // Untuk OUT dan TRANSFER, pastikan stok yang tersedia mencukupi
  const available = calculateAvailableStock(state)
  return available >= amount
}
