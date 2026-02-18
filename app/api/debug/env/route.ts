import { NextResponse } from "next/server";

// Temporary debug endpoint — DO NOT leave enabled in production longer than necessary.
export async function GET() {
  const checks = {
    NEXT_PUBLIC_RAZORPAY_KEY_ID: {
      present: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      length: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.length || 0,
      value: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? "SET" : "NOT_SET",
    },
    RAZORPAY_KEY_ID: {
      present: !!process.env.RAZORPAY_KEY_ID,
      length: process.env.RAZORPAY_KEY_ID?.length || 0,
      value: process.env.RAZORPAY_KEY_ID ? "SET" : "NOT_SET",
    },
    RAZORPAY_KEY_SECRET: {
      present: !!process.env.RAZORPAY_KEY_SECRET,
      length: process.env.RAZORPAY_KEY_SECRET?.length || 0,
      value: process.env.RAZORPAY_KEY_SECRET ? "SET" : "NOT_SET",
    },
    NEXT_PUBLIC_RAZORPAY_KEY_SECRET: {
      present: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET,
      length: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET?.length || 0,
      value: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET ? "SET" : "NOT_SET",
    },
  };

  // Test: Hard-code a value to verify endpoint works
  const testCheck = {
    testValue: "HARD_CODED_TEST_12345",
    allEnvKeys: Object.keys(process.env).filter(k => k.includes("RAZORPAY") || k.includes("razorpay")).length,
  };

  // Return minimal info only (no secret values)
  return NextResponse.json({ ok: true, env: checks, test: testCheck }, { status: 200 });
}
