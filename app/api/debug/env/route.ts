import { NextResponse } from "next/server";

// Temporary debug endpoint — DO NOT leave enabled in production longer than necessary.
export async function GET() {
  const checks = {
    NEXT_PUBLIC_RAZORPAY_KEY_ID: {
      present: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      length: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.length || 0,
    },
    RAZORPAY_KEY_ID: {
      present: !!process.env.RAZORPAY_KEY_ID,
      length: process.env.RAZORPAY_KEY_ID?.length || 0,
    },
    RAZORPAY_KEY_SECRET: {
      present: !!process.env.RAZORPAY_KEY_SECRET,
      length: process.env.RAZORPAY_KEY_SECRET?.length || 0,
    },
    NEXT_PUBLIC_RAZORPAY_KEY_SECRET: {
      present: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET,
      length: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET?.length || 0,
    },
  };

  // Return minimal info only (no secret values)
  return NextResponse.json({ ok: true, env: checks }, { status: 200 });
}
