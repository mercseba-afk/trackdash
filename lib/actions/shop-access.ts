"use server"
import { canAccessShop } from "@/lib/server/shop-gate"
export async function getShopAccessAction(): Promise<boolean> {
  return canAccessShop()
}
