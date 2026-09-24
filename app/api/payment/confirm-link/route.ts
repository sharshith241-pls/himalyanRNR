import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";

const paymentLinkIdPattern = /^plink_[a-zA-Z0-9]+$/;
const paymentIdPattern = /^pay_[a-zA-Z0-9]+$/;

export async function POST(request: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, error: "Payment service unavailable" }, { status: 503 });
    }

    const body = await request.json();
    const {
      paymentLinkId,
      paymentId,
      paymentLinkReferenceId,
      paymentLinkStatus,
      paymentLinkSignature,
    } = body;

    if (!paymentLinkIdPattern.test(paymentLinkId || "") || !paymentIdPattern.test(paymentId || "") || paymentLinkStatus !== "paid") {
      return NextResponse.json({ success: false, error: "Invalid payment callback" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${paymentLinkId}|${paymentLinkReferenceId || ""}|${paymentLinkStatus}|${paymentId}`)
      .digest("hex");
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const paymentLink = await razorpay.paymentLink.fetch(paymentLinkId) as any;
    if (!paymentLink || paymentLink.status !== "paid") {
      return NextResponse.json({ success: false, error: "Payment could not be confirmed" }, { status: 400 });
    }

    const matchingPayment = Array.isArray(paymentLink.payments)
      && paymentLink.payments.some((payment: { payment_id?: string }) => payment.payment_id === paymentId);
    const validSignature = typeof paymentLinkSignature === "string"
      && paymentLinkSignature.length === expectedSignature.length
      && crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(paymentLinkSignature));
    if (!matchingPayment && !validSignature) {
      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
    }

    const notes = paymentLink.notes as Record<string, string | number | null>;
    if (!notes?.trekId || !notes?.userEmail || !notes?.userName) {
      return NextResponse.json({ success: false, error: "Payment metadata is incomplete" }, { status: 400 });
    }

    const supabase = await createClient();
    const paymentType = notes.paymentType === "advance" ? "advance" : "full";
    const { data: booking, error } = await supabase
      .from("bookings")
      .upsert({
        trek_id: String(notes.trekId),
        user_id: notes.userId ? String(notes.userId) : null,
        user_email: String(notes.userEmail),
        user_name: String(notes.userName),
        razorpay_payment_id: paymentId,
        razorpay_order_id: paymentLinkId,
        status: "completed",
        amount: Number(paymentLink.amount) / 100,
        full_amount: Number(notes.fullAmount || Number(paymentLink.amount) / 100),
        payment_type: paymentType,
        has_full_access: paymentType === "full",
        currency: paymentLink.currency || "INR",
        updated_at: new Date().toISOString(),
      }, { onConflict: "razorpay_payment_id" })
      .select("id, trek_id, amount, payment_type, has_full_access")
      .single();

    if (error) {
      console.error("Booking entitlement save failed:", error.message);
      return NextResponse.json({ success: false, error: "Failed to save booking" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      booking: { ...booking, trek_title: notes.trekTitle ? String(notes.trekTitle) : "Your trek" },
    });
  } catch (error) {
    console.error("Payment link confirmation failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, error: "Payment verification service error" }, { status: 500 });
  }
}
