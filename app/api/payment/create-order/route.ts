import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/utils/supabase/server";

const createRazorpayInstance = () => {
  // Accept multiple possible env var names (some setups use NEXT_PUBLIC prefix, some don't)
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET;

  // Log detailed info for debugging
  console.log("=== RAZORPAY ENV DEBUG ===");
  console.log("Raw NEXT_PUBLIC_RAZORPAY_KEY_ID:", JSON.stringify(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID));
  console.log("Raw RAZORPAY_KEY_ID:", JSON.stringify(process.env.RAZORPAY_KEY_ID));
  console.log("Raw RAZORPAY_KEY_SECRET (first 10 chars):", JSON.stringify(process.env.RAZORPAY_KEY_SECRET?.substring(0, 10)));
  console.log("Raw NEXT_PUBLIC_RAZORPAY_KEY_SECRET (first 10 chars):", JSON.stringify(process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET?.substring(0, 10)));
  
  console.log("Resolved keyId:", JSON.stringify(keyId));
  console.log("Resolved keySecret (first 10 chars):", JSON.stringify(keySecret?.substring(0, 10)));
  
  console.log("Environment check (create-order):", {
    hasKeyId: !!keyId,
    keyIdLength: keyId?.length || 0,
    keyIdPrefix: keyId?.substring(0, 8) || "none",
    hasKeySecret: !!keySecret,
    keySecretLength: keySecret?.length || 0,
  });

  if (!keyId || !keySecret) {
    console.error("Missing Razorpay credentials (create-order):", {
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
    console.log("Razorpay instance created successfully (create-order)");
    return instance;
  } catch (error) {
    console.error("Failed to create Razorpay instance (create-order):", error instanceof Error ? error.message : error);
    return null;
  }
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

    const { trekId, amount, userEmail, userName, couponCode, userId } = body;

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

    // Initialize coupon discount tracking
    let finalAmount = amount;
    let discountAmount = 0;
    let couponId: string | null = null;
    let couponDiscountPercentage = 0;

    // Handle coupon code if provided
    if (couponCode) {
      const supabase = await createClient();

      // Fetch and validate coupon
      const { data: coupon, error: couponError } = await supabase
        .from("coupon_codes")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (couponError || !coupon) {
        return NextResponse.json(
          { success: false, error: "Invalid or inactive coupon code" },
          { status: 400, headers }
        );
      }

      // Check if coupon has expired
      if (new Date(coupon.estimated_expiry) < new Date()) {
        return NextResponse.json(
          { success: false, error: "Coupon code has expired" },
          { status: 400, headers }
        );
      }

      // Check max uses
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        return NextResponse.json(
          { success: false, error: "Coupon code has reached maximum uses" },
          { status: 400, headers }
        );
      }

      // Check if coupon is valid for this trek
      if (coupon.trek_ids && coupon.trek_ids.length > 0 && !coupon.trek_ids.includes(trekId)) {
        return NextResponse.json(
          { success: false, error: "This coupon is not valid for this trek" },
          { status: 400, headers }
        );
      }

      // Calculate discount
      discountAmount = (amount * coupon.discount_percentage) / 100;
      finalAmount = amount - discountAmount;
      couponId = coupon.id;
      couponDiscountPercentage = coupon.discount_percentage;

      console.log("Coupon applied:", {
        code: coupon.code,
        discount: coupon.discount_percentage + "%",
        discountAmount,
        finalAmount,
      });
    }

    console.log("Creating Razorpay payment link:", { trekId, amount, finalAmount, userEmail, appliedCoupon: !!couponCode });

    // Create Razorpay Payment Link (Hosted Checkout)
    try {
      // Get the actual deployed domain from environment variable
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      
      // Log environment variable for debugging
      console.log("Environment check - NEXT_PUBLIC_APP_URL:", appUrl);
      
      // Build payment link configuration
      const paymentLinkConfig: any = {
        amount: Math.round(finalAmount * 100), // Amount in paise (with discount applied)
        currency: "INR",
        customer: {
          name: userName,
          email: userEmail,
        },
        description: `Trek Booking - ${trekId}${couponCode ? ` (Coupon: ${couponCode})` : ""}`,
        notify: {
          sms: false,
          email: true,
        },
        notes: {
          trekId,
          userEmail,
          userName,
          originalAmount: amount,
          finalAmount: finalAmount,
          discountAmount: discountAmount,
          discountPercentage: couponDiscountPercentage,
          couponCode: couponCode || null,
          userId: userId || null,
        },
        callback_method: "get",
      };

      // IMPORTANT: Only add callback_url if we have a valid production domain
      // DO NOT fallback to localhost - that breaks production!
      if (appUrl && !appUrl.includes("localhost") && !appUrl.includes("127.0.0.1")) {
        paymentLinkConfig.callback_url = `${appUrl}/success`;
        console.log("✅ Production mode - callback_url set to:", paymentLinkConfig.callback_url);
      } else {
        console.warn("⚠️ WARNING: NEXT_PUBLIC_APP_URL is not set or is localhost. Callback URL will not be included.");
        if (!appUrl) {
          console.error("❌ ERROR: NEXT_PUBLIC_APP_URL environment variable is missing! Set it in your deployment platform.");
        }
      }

      const paymentLink = await razorpayInstance.paymentLink.create(paymentLinkConfig);

      console.log("Payment link created successfully:", paymentLink.short_url);

      // Validate payment link creation
      if (!paymentLink || !paymentLink.short_url) {
        console.error("Payment link creation returned invalid response");
        return NextResponse.json(
          { error: "Failed to create payment link" },
          { status: 500, headers }
        );
      }

      return NextResponse.json({
        id: paymentLink.id,
        short_url: paymentLink.short_url,
        payment_link_url: paymentLink.short_url,
        originalAmount: amount,
        finalAmount: finalAmount,
        discountAmount: discountAmount,
        couponApplied: !!couponCode,
      }, { status: 201, headers });
    } catch (razorpayError) {
      // Log full error object for Razorpay API errors
      console.error("Razorpay API error (full):", razorpayError);
      console.error("Razorpay API error (detailed):", {
        message: (razorpayError as any)?.message,
        code: (razorpayError as any)?.code,
        statusCode: (razorpayError as any)?.statusCode,
        error: (razorpayError as any)?.error,
        response: (razorpayError as any)?.response,
        requestId: (razorpayError as any)?.requestId,
      });
      throw razorpayError;
    }
  } catch (error) {
    // Log full error for debugging - handle both Error and plain objects
    const errorDetails = {
      fullError: error,
      message: (error as any)?.message,
      code: (error as any)?.code,
      statusCode: (error as any)?.statusCode,
      error: (error as any)?.error,
      response: (error as any)?.response,
      type: typeof error,
      isError: error instanceof Error,
    };
    
    console.error("Order creation error (full):", JSON.stringify(errorDetails, null, 2));
    
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
