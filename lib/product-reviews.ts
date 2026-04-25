import { supabase } from "@/lib/supabase";

export interface ProductReview {
  id: number;
  reservation_id: string;
  product_id: string;
  product_name: string;
  customer_name: string;
  review_text: string;
  created_at: string;
}

export async function fetchProductReviews(productId: string) {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, reservation_id, product_id, product_name, customer_name, review_text, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching product reviews:", error);
    return [] as ProductReview[];
  }

  return data as ProductReview[];
}

export async function submitProductReview(input: {
  reservationId: string;
  productId: string;
  productName: string;
  customerName: string;
  reviewText: string;
}) {
  const { data, error } = await supabase
    .from("product_reviews")
    .insert({
      reservation_id: input.reservationId,
      product_id: input.productId,
      product_name: input.productName,
      customer_name: input.customerName,
      review_text: input.reviewText.trim(),
    })
    .select("id, reservation_id, product_id, product_name, customer_name, review_text, created_at")
    .single();

  if (error) throw error;
  return data as ProductReview;
}