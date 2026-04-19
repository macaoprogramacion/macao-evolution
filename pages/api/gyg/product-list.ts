import type { NextApiRequest, NextApiResponse } from "next"
import { authenticate, authError, gygError, PRODUCTS, SUPPLIER_ID, SUPPLIER_NAME } from "@/lib/gyg/config"
import type { SupplierProductsResponse } from "@/lib/gyg/types"

/**
 * GET /api/gyg/1/suppliers/{supplierId}/products/
 *
 * Returns the entire list of products for the requested supplier ID.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(200).json(gygError("VALIDATION_FAILURE", "Only GET is accepted."))
  }

  if (!authenticate(req)) {
    return res.status(200).json(authError())
  }

  // supplierId is passed from the router via query
  const supplierId = req.query.supplierId as string

  if (!supplierId) {
    return res.status(200).json(
      gygError("VALIDATION_FAILURE", "Missing supplierId path parameter.")
    )
  }

  if (supplierId !== SUPPLIER_ID) {
    return res.status(200).json(
      gygError("VALIDATION_FAILURE", `Supplier '${supplierId}' not found.`)
    )
  }

  const products = Object.values(PRODUCTS).map((p) => ({
    productId: p.id,
    productTitle: p.name,
  }))

  const response: SupplierProductsResponse = {
    data: {
      supplierId: SUPPLIER_ID,
      supplierName: SUPPLIER_NAME,
      products,
    },
  }

  return res.status(200).json(response)
}
