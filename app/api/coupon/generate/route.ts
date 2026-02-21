import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

// Generate coupon code after successful payment
export async function POST(request: NextRequest) {
  try {
    const { userId, trekId, paymentId, amount } = await request.json();

    // Validate inputs
    if (!userId || !trekId || !paymentId || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, trekId, paymentId, amount" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user owns this payment (optional - add your own verification logic)
    // For now, we'll just check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate unique coupon code
    // Format: TREK[4 chars]-[random 6 chars-uppercase]
    // Example: TREK-ABC123XYZ
    let couponCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const trekPrefix = trekId.substring(0, 4).toUpperCase();
      const randomPart = crypto.randomBytes(4).toString("hex").substring(0, 6).toUpperCase();
      couponCode = `TREK${trekPrefix}${randomPart}`;

      // Check if code already exists
      const { data: existing } = await supabase
        .from("coupon_codes")
        .select("id")
        .eq("code", couponCode)
        .single();

      isUnique = !existing;
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { success: false, error: "Failed to generate unique coupon code" },
        { status: 500 }
      );
    }

    // Insert coupon code
    const { data: newCoupon, error: insertError } = await supabase
      .from("coupon_codes")
      .insert([
        {
          code: couponCode,
          discount_percentage: 10, // 10% discount
          created_by: user.id,
          max_uses: 999, // Can be used many times but track total
          trek_ids: [trekId], // Valid only for this trek
          notes: `Generated for payment ${paymentId} on trek ${trekId}`,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Coupon insertion error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to create coupon code" },
        { status: 500 }
      );
    }

    // Log the coupon generation
    await supabase.from("coupon_usage_logs").insert([
      {
        coupon_id: newCoupon.id,
        user_id: user.id,
        payment_id: paymentId,
        trek_id: trekId,
        discount_amount: 0, // No discount on the original payment
        original_amount: amount,
        final_amount: amount,
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        coupon: {
          code: newCoupon.code,
          discountPercentage: newCoupon.discount_percentage,
          validFor: trekId,
          expiryDate: newCoupon.estimated_expiry,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Coupon generation error:", error);
    return NextResponse.json(
      { success: false, error: "Coupon generation failed" },
      { status: 500 }
    );
  }
}
