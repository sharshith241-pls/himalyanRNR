import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";

const createRazorpayInstance = () => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

const razorpayInstance = createRazorpayInstance();

export async function POST(request: NextRequest) {
  try {
    if (!razorpayInstance) {
      return NextResponse.json(
        { error: "Razorpay is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { orderId, razorpayPaymentId, razorpaySignature } = body;

    // Verify signature
    const shasum = crypto.createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET || ""
    );
    shasum.update(`${orderId}|${razorpayPaymentId}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpaySignature) {
      return NextResponse.json(
        { error: "Invalid signature", success: false },
        { status: 400 }
      );
    }

    // Save booking to database
    const supabase = await createClient();

    // Get order details from Razorpay
    const order = await razorpayInstance.orders.fetch(orderId);
    const notes = order.notes as any;

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          trek_id: notes.trekId,
          user_email: notes.userEmail,
          user_name: notes.userName,
          razorpay_order_id: orderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          status: "completed",
          amount: (order as any).amount / 100,
          currency: (order as any).currency,
          created_at: new Date(),
        },
      ]);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save booking", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified and booking confirmed",
        booking: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment", success: false },
      { status: 500 }
    );
  }
}
