import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const createRazorpayInstance = () => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error("Missing Razorpay credentials:", {
      hasKeyId: !!keyId,
      hasKeySecret: !!keySecret,
    });
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validate amount (in rupees)
const isValidAmount = (amount: number): boolean => {
  return Number.isFinite(amount) && amount >= 1 && amount <= 1000000;
};

// Validate string length and content
const isValidString = (str: string, minLength: number = 1, maxLength: number = 255): boolean => {
  return typeof str === "string" && str.length >= minLength && str.length <= maxLength && !/[<>\"']/g.test(str);
};

export async function POST(request: NextRequest) {
  try {
    // Verify request method
    if (request.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Get Razorpay instance
    const razorpayInstance = createRazorpayInstance();
    
    if (!razorpayInstance) {
      console.error("Razorpay instance creation failed - Missing credentials");
      return NextResponse.json(
        { error: "Payment service unavailable. Please contact support." },
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
        { error: "Invalid request body" },
        { status: 400, headers }
      );
    }

    const { trekId, amount, userEmail, userName } = body;

    // Validate all required fields
    if (!trekId || !amount || !userEmail || !userName) {
      return NextResponse.json(
        { error: "Missing required fields: trekId, amount, userEmail, userName" },
        { status: 400, headers }
      );
    }

    // Validate trek ID format
    if (!isValidString(trekId, 1, 50) || !/^[a-zA-Z0-9\-_]+$/.test(trekId)) {
      return NextResponse.json(
        { error: "Invalid trek ID format" },
        { status: 400, headers }
      );
    }

    // Validate amount
    if (!isValidAmount(amount)) {
      return NextResponse.json(
        { error: "Invalid amount. Must be between ₹1 and ₹10,00,000" },
        { status: 400, headers }
      );
    }

    // Validate email
    if (!isValidEmail(userEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400, headers }
      );
    }

    // Validate username
    if (!isValidString(userName, 2, 100)) {
      return NextResponse.json(
        { error: "Invalid name. Must be 2-100 characters" },
        { status: 400, headers }
      );
    }

    console.log("Creating Razorpay order:", { trekId, amount, userEmail });

    // Create Razorpay order
    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100), // Amount in paise
      currency: "INR",
      receipt: `trek-${trekId}-${Date.now()}`,
      payment_capture: true, // Auto-capture payment
      notes: {
        trekId,
        userEmail,
        userName,
      },
    });

    console.log("Order created successfully:", order.id);

    // Validate order creation
    if (!order || !order.id) {
      console.error("Order creation returned invalid response");
      return NextResponse.json(
        { error: "Failed to create payment order" },
        { status: 500, headers }
      );
    }

    return NextResponse.json(order, { status: 201, headers });
  } catch (error) {
    // Log error without exposing sensitive details
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Order creation error:", errorMsg);
    
    return NextResponse.json(
      { error: "Payment service error. Please try again later." },
      { status: 500, headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      }}
    );
  }
}
