import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Validate and get discount from coupon code
export async function POST(request: NextRequest) {
  try {
    const { couponCode, amount, trekId } = await request.json();

    // Validate inputs
    if (!couponCode || !amount || !trekId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: couponCode, amount, trekId" },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Fetch coupon code
    const { data: coupon, error: couponError } = await supabase
      .from("coupon_codes")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (couponError || !coupon) {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive coupon code" },
        { status: 400 }
      );
    }

    // Check if coupon has expired
    if (new Date(coupon.estimated_expiry) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Coupon code has expired" },
        { status: 400 }
      );
    }

    // Check max uses
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json(
        { success: false, error: "Coupon code has reached maximum uses" },
        { status: 400 }
      );
    }

    // Check if coupon is valid for this trek (if trek_ids is specified)
    if (coupon.trek_ids && coupon.trek_ids.length > 0 && !coupon.trek_ids.includes(trekId)) {
      return NextResponse.json(
        { success: false, error: "This coupon is not valid for this trek" },
        { status: 400 }
      );
    }

    // Calculate discount
    const discountPercentage = coupon.discount_percentage;
    const discountAmount = (amount * discountPercentage) / 100;
    const finalAmount = amount - discountAmount;

    return NextResponse.json(
      {
        success: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountPercentage,
          discountAmount: Math.round(discountAmount * 100) / 100,
          finalAmount: Math.round(finalAmount * 100) / 100,
          originalAmount: amount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { success: false, error: "Coupon validation failed" },
      { status: 500 }
    );
  }
}
