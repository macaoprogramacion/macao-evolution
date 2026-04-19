import type { NextApiRequest, NextApiResponse } from "next"
import { authenticate, authError, gygError, getProduct } from "@/lib/gyg/config"
import type { AddonsResponse } from "@/lib/gyg/types"

/**
 * GET /api/gyg/1/products/{productId}/addons/
 *
 * Returns the list of available addons for the requested product.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(200).json(gygError("VALIDATION_FAILURE", "Only GET is accepted."))
  }

  if (!authenticate(req)) {
    return res.status(200).json(authError())
  }

  const productId = req.query.productId as string

  if (!productId) {
    return res.status(200).json(
      gygError("VALIDATION_FAILURE", "Missing productId path parameter.")
    )
  }

  const product = getProduct(productId)
  if (!product) {
    return res.status(200).json(
      gygError("INVALID_PRODUCT", `Product '${productId}' does not exist.`)
    )
  }

  const addons = (product.addons || []).map((a) => ({
    addonType: a.addonType,
    retailPrice: a.retailPrice,
    currency: a.currency,
    ...(a.addonDescription ? { addonDescription: a.addonDescription } : {}),
  }))

  const response: AddonsResponse = {
    data: { addons },
  }

  return res.status(200).json(response)
}
