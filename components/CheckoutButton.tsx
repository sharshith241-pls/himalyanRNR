"use client";

import { useState } from "react";

interface CheckoutProps {
  trekId: string;
  trekTitle: string;
  amount: number;
  advanceAmount?: number;
  userEmail: string;
  userName: string;
  userId?: string;
  slotId?: string;
  slotDate?: string;
  slotRequired?: boolean;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
}

export default function CheckoutButton({
  trekId,
  trekTitle,
  amount,
  advanceAmount,
  userEmail,
  userName,
  userId,
  slotId,
  slotDate,
  slotRequired = false,
  onSuccess,
  onError,
}: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<{
    discountAmount: number;
    finalAmount: number;
    discountPercentage: number;
  } | null>(null);
  const [paymentType, setPaymentType] = useState<"advance" | "full">("full");
  const configuredAdvanceAmount = advanceAmount && advanceAmount > 0 && advanceAmount < amount
    ? advanceAmount
    : Math.round(amount * 0.4);
  const selectedAmount = paymentType === "advance" ? configuredAdvanceAmount : amount;

  // Validate inputs before payment
  const validateInputs = (): boolean => {
    if (!trekId || !trekTitle || !selectedAmount || !userEmail || !userName) {
      setError("Missing booking information. Please try again.");
      return false;
    }

    if (slotRequired && (!slotId || !slotDate)) {
      setError("Please choose an available trek date before continuing.");
      return false;
    }

    if (selectedAmount < 1 || selectedAmount > 1000000) {
      setError("Invalid payment amount. Please try again.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setError("Invalid email address. Please check and try again.");
      return false;
    }

    if (userName.length < 2 || userName.length > 100) {
      setError("Invalid name. Please try again.");
      return false;
    }

    return true;
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setValidatingCoupon(true);
    setError(null);

    try {
      const response = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: couponCode.toUpperCase(),
          amount: selectedAmount,
          paymentType,
          fullAmount: amount,
          trekId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid coupon code");
      }

      const data = await response.json();
      if (data.success && data.coupon) {
        setDiscountInfo({
          discountAmount: data.coupon.discountAmount,
          finalAmount: data.coupon.finalAmount,
          discountPercentage: data.coupon.discountPercentage,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Coupon validation failed");
      setDiscountInfo(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    setError(null);

    // Validate inputs
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      // Create payment link on backend
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trekId,
          trekTitle,
          amount: selectedAmount,
          paymentType,
          fullAmount: amount,
          userEmail,
          userName,
          userId,
          slotId,
          slotDate,
          couponCode: couponCode || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment link");
      }

      const paymentData = await response.json();

      if (!paymentData?.short_url) {
        throw new Error("Payment link not generated. Please try again.");
      }

      // Store payment data in sessionStorage for retrieval after payment
      sessionStorage.setItem(
        "paymentInfo",
        JSON.stringify({
          trekId,
          trekTitle,
          amount: selectedAmount,
          paymentType,
          discountAmount: discountInfo?.discountAmount || 0,
          finalAmount: discountInfo?.finalAmount || selectedAmount,
          couponCode: couponCode || null,
        })
      );

      // For development mode - add a note about manual navigation
      const isDevelopment = process.env.NODE_ENV === "development" || 
                           typeof window !== "undefined" && window.location.hostname === "localhost";
      
      if (isDevelopment) {
        console.log("🔄 Dev Mode: After payment, you'll be redirected to the success page automatically.");
      }

      // Redirect to Razorpay hosted checkout page
      window.location.href = paymentData.short_url;
    } catch (err: any) {
      const errorMessage = err?.message || "Payment failed. Please try again.";
      console.error("Checkout error:", errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
      setLoading(false);
    }
  };

  const effectiveAmount = discountInfo?.finalAmount || selectedAmount;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
        <p className="mb-2 text-sm font-semibold text-gray-800">Choose payment amount</p>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-white p-1">
          <button type="button" onClick={() => { setPaymentType("advance"); setDiscountInfo(null); }} className={`rounded-md px-3 py-2 text-sm font-semibold ${paymentType === "advance" ? "bg-teal-600 text-white" : "text-gray-700"}`}>
            Pay advance ₹{configuredAdvanceAmount.toLocaleString("en-IN")}
          </button>
          <button type="button" onClick={() => { setPaymentType("full"); setDiscountInfo(null); }} className={`rounded-md px-3 py-2 text-sm font-semibold ${paymentType === "full" ? "bg-teal-600 text-white" : "text-gray-700"}`}>
            Pay full ₹{amount.toLocaleString("en-IN")}
          </button>
        </div>
      </div>
      {/* Coupon Section */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Have a coupon code?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              setDiscountInfo(null); // Reset discount when code changes
              setError(null);
            }}
            placeholder="Enter coupon code"
            disabled={loading || validatingCoupon}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={applyCoupon}
            disabled={loading || validatingCoupon || !couponCode.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validatingCoupon ? "Validating..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Discount Display */}
      {discountInfo && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-green-700">Discount ({discountInfo.discountPercentage}%)</span>
            <span className="text-sm font-semibold text-green-700">-₹{discountInfo.discountAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="border-t border-green-200 pt-2 flex justify-between items-center">
            <span className="text-lg font-bold text-green-900">Final Amount</span>
            <span className="text-lg font-bold text-green-900">₹{discountInfo.finalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handleCheckout}
        disabled={loading || !selectedAmount || selectedAmount <= 0}
        className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
        aria-label={`Pay ₹${effectiveAmount.toLocaleString("en-IN")} for ${trekTitle}`}
      >
        {loading ? (
          <>
            <span className="inline-block animate-spin">⏳</span>
            Processing...
          </>
        ) : (
          <>
            <span>💳</span>
            Pay ₹{effectiveAmount.toLocaleString("en-IN")}
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm font-medium">⚠️ {error}</p>
          <p className="text-red-600 text-xs mt-1">If the problem persists, please contact support.</p>
        </div>
      )}
    </div>
  );
}
