import "server-only"

import { eq } from "drizzle-orm"
import { COLLECTIBLE_VERTICALS } from "@/lib/verticals"
import { db } from "../index"
import { products } from "../schema"

export async function listHotWheelsPilotProducts() {
  return db.query.products.findMany({
    where: eq(products.categoryId, COLLECTIBLE_VERTICALS.hotwheels.categoryId),
    with: {
      brand: true,
      category: true,
      images: true,
      releases: {
        with: {
          images: true,
          sources: true,
          identifiers: true,
          hotwheelsDetails: true,
          hotwheelsSubvariants: true,
        },
      },
    },
    orderBy: (fields, { asc }) => [asc(fields.name)],
  })
}
