import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";

const createRazorpayInstance = () => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // Log all env variables for debugging
  console.log("Verify endpoint - Environment check:", {
    hasKeyId: !!keyId,
    keyIdLength: keyId?.length || 0,
    hasKeySecret: !!keySecret,
    keySecretLength: keySecret?.length || 0,
  });

  if (!keyId || !keySecret) {
    console.error("Missing Razorpay credentials:", {
      hasKeyId: !!keyId,
      hasKeySecret: !!keySecret,
    });
    return null;
  }

  try {
    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    console.log("Razorpay instance created successfully in verify endpoint");
    return instance;
  } catch (error) {
    console.error("Failed to create Razorpay instance:", error instanceof Error ? error.message : error);
    return null;
  }
};

const razorpayInstance = createRazorpayInstance();

// Validate signature format
const isValidSignature = (signature: string): boolean => {
  return /^[a-f0-9]{64}$/.test(signature); // SHA256 hex string
};

// Validate payment ID format
const isValidPaymentId = (paymentId: string): boolean => {
  return /^pay_[a-zA-Z0-9]{14}$/.test(paymentId);
};

// Validate order ID format
const isValidOrderId = (orderId: string): boolean => {
  return /^order_[a-zA-Z0-9]{14}$/.test(orderId);
};

export async function POST(request: NextRequest) {
  try {
    // Verify request method
    if (request.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed", success: false },
        { status: 405 }
      );
    }

    // Verify Razorpay is configured
    if (!razorpayInstance) {
      console.error("Razorpay instance not initialized");
      return NextResponse.json(
        { error: "Payment service unavailable", success: false },
        { status: 503 }
      );
    }

    // Add security headers
    const headers = new Headers();
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-XSS-Protection", "1; mode=block");

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body", success: false },
        { status: 400, headers }
      );
    }

    const { orderId, razorpayPaymentId, razorpaySignature } = body;

    // Validate required fields
    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing required verification fields", success: false },
        { status: 400, headers }
      );
    }

    // Validate format of IDs and signature
    if (!isValidOrderId(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID format", success: false },
        { status: 400, headers }
      );
    }

    if (!isValidPaymentId(razorpayPaymentId)) {
      return NextResponse.json(
        { error: "Invalid payment ID format", success: false },
        { status: 400, headers }
      );
    }

    if (!isValidSignature(razorpaySignature)) {
      return NextResponse.json(
        { error: "Invalid signature format", success: false },
        { status: 400, headers }
      );
    }

    // Verify signature using HMAC-SHA256
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const shasum = crypto.createHmac("sha256", keySecret);
    shasum.update(`${orderId}|${razorpayPaymentId}`);
    const digest = shasum.digest("hex");

    // Signature verification
    if (digest !== razorpaySignature) {
      console.warn(`Signature mismatch for order: ${orderId}`);
      return NextResponse.json(
        { error: "Payment verification failed", success: false },
        { status: 400, headers }
      );
    }

    // Get order details from Razorpay for additional verification
    let order;
    try {
      order = await razorpayInstance.orders.fetch(orderId);
    } catch (err) {
      console.error("Failed to fetch order from Razorpay:", err);
      return NextResponse.json(
        { error: "Payment verification service error", success: false },
        { status: 500, headers }
      );
    }

    if (!order || order.id !== orderId) {
      console.error("Order mismatch");
      return NextResponse.json(
        { error: "Order verification failed", success: false },
        { status: 400, headers }
      );
    }

    const notes = order.notes as any;

    // Verify notes contain expected data
    if (!notes?.trekId || !notes?.userEmail || !notes?.userName) {
      console.error("Missing order notes");
      return NextResponse.json(
        { error: "Order data verification failed", success: false },
        { status: 400, headers }
      );
    }

    // Save booking to database with transaction safety
    const supabase = await createClient();

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
          amount: Math.round((Number(order.amount) || 0) / 100), // Convert paise to rupees
          currency: order.currency || "INR",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Database error:", error.message);
      return NextResponse.json(
        { error: "Failed to process booking", success: false },
        { status: 500, headers }
      );
    }

    if (!data || data.length === 0) {
      console.error("No booking data returned");
      return NextResponse.json(
        { error: "Booking creation failed", success: false },
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified and booking confirmed",
        booking: data[0],
      },
      { status: 200, headers }
    );
  } catch (error) {
    // Log error without exposing sensitive details
    console.error("Payment verification error:", error instanceof Error ? error.message : "Unknown error");
    
    return NextResponse.json(
      { error: "Payment verification service error", success: false },
      { status: 500, headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      }}
    );
  }
}
