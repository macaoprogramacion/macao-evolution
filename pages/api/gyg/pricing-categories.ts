import type { NextApiRequest, NextApiResponse } from "next"
import { authenticate, authError, gygError, getProduct } from "@/lib/gyg/config"

/**
 * GET /api/gyg/1/products/{productId}/pricing-categories
 *
 * Returns pricing categories for the requested product.
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

  const pricingCategories = (product.prices || []).map((p) => ({
    category: p.category,
    retailPrice: p.price,
    currency: product.currency,
  }))

  // Keep both top-level and data-wrapped field for compatibility with GYG validator variants.
  return res.status(200).json({
    pricingCategories,
    data: {
      productId,
      currency: product.currency,
      pricingCategories,
    },
  })
}
