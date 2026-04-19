import type { NextApiRequest, NextApiResponse } from "next"
import { authenticate, authError, gygError, getProduct, SUPPLIER_ID } from "@/lib/gyg/config"
import type { ProductDetailsResponse } from "@/lib/gyg/types"

/**
 * GET /api/gyg/1/products/{productId}
 *
 * Returns content and configurational settings for a product.
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

  const response: ProductDetailsResponse = {
    data: {
      supplierId: SUPPLIER_ID,
      productTitle: product.name,
      productDescription: product.description,
      destinationLocation: product.destinationLocation,
      configuration: {
        participantsConfiguration: {
          min: product.minParticipants,
          max: product.maxParticipants,
        },
      },
    },
  }

  return res.status(200).json(response)
}
