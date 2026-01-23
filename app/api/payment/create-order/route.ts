import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";

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
        { error: "Razorpay is not configured. Please set RAZORPAY keys in environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { trekId, amount, userEmail, userName } = body;

    if (!trekId || !amount || !userEmail || !userName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const order = await razorpayInstance.orders.create({
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `trek-${trekId}-${Date.now()}`,
      notes: {
        trekId,
        userEmail,
        userName,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
