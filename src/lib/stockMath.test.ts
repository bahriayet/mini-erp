import { describe, it, expect } from "vitest"
import { calculateAvailableStock, canMutateStock } from "./stockMath"

describe("Logika Matematika Stok (Stock Math Logic)", () => {
  describe("Fungsi calculateAvailableStock", () => {
    it("harus menghitung stok tersedia dengan benar jika stok fisik lebih besar dari reserved", () => {
      const state = { quantity: 100, reserved: 20 }
      const res = calculateAvailableStock(state)
      expect(res).toBe(80)
    })

    it("harus mengembalikan 0 jika kuantitas reserved sama dengan kuantitas fisik", () => {
      const state = { quantity: 50, reserved: 50 }
      const res = calculateAvailableStock(state)
      expect(res).toBe(0)
    })

    it("harus mengembalikan 0 dan mencegah nilai minus jika reserved lebih besar dari kuantitas fisik (anomali)", () => {
      const state = { quantity: 30, reserved: 45 }
      const res = calculateAvailableStock(state)
      expect(res).toBe(0)
    })
  })

  describe("Fungsi canMutateStock", () => {
    it("harus selalu memperbolehkan stok masuk (IN) jika jumlahnya positif", () => {
      const state = { quantity: 10, reserved: 0 }
      const canMutate = canMutateStock(state, "IN", 50)
      expect(canMutate).toBe(true)
    })

    it("harus menolak stok masuk (IN) jika jumlahnya negatif atau 0", () => {
      const state = { quantity: 10, reserved: 0 }
      expect(canMutateStock(state, "IN", -10)).toBe(false)
      expect(canMutateStock(state, "IN", 0)).toBe(false)
    })

    it("harus memperbolehkan stok keluar (OUT) jika kuantitas tersedia mencukupi", () => {
      const state = { quantity: 100, reserved: 30 } // Tersedia: 70
      const canMutate = canMutateStock(state, "OUT", 50)
      expect(canMutate).toBe(true)
    })

    it("harus menolak stok keluar (OUT) jika kuantitas tersedia tidak mencukupi", () => {
      const state = { quantity: 100, reserved: 30 } // Tersedia: 70
      const canMutate = canMutateStock(state, "OUT", 75)
      expect(canMutate).toBe(false)
    })

    it("harus menolak transfer (TRANSFER) jika kuantitas tersedia tidak mencukupi akibat terkunci", () => {
      const state = { quantity: 50, reserved: 40 } // Tersedia: 10
      const canTransfer = canMutateStock(state, "TRANSFER", 15)
      expect(canTransfer).toBe(false)
    })
  })
})
