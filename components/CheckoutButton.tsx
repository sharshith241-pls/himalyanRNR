"use client";

import { useState } from "react";

interface CheckoutProps {
  trekId: string;
  trekTitle: string;
  amount: number;
  userEmail: string;
  userName: string;
  userId?: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
}

export default function CheckoutButton({
  trekId,
  trekTitle,
  amount,
  userEmail,
  userName,
  userId,
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

  // Validate inputs before payment
  const validateInputs = (): boolean => {
    if (!trekId || !trekTitle || !amount || !userEmail || !userName) {
      setError("Missing booking information. Please try again.");
      return false;
    }

    if (amount < 1 || amount > 1000000) {
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
          amount,
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
          amount,
          userEmail,
          userName,
          userId,
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

      // Redirect to Razorpay hosted checkout page
      // Store payment data in sessionStorage for retrieval after redirect
      sessionStorage.setItem(
        "paymentInfo",
        JSON.stringify({
          trekId,
          trekTitle,
          amount,
          discountAmount: discountInfo?.discountAmount || 0,
          finalAmount: discountInfo?.finalAmount || amount,
          couponCode: couponCode || null,
        })
      );

      window.location.href = paymentData.short_url;
    } catch (err: any) {
      const errorMessage = err?.message || "Payment failed. Please try again.";
      console.error("Checkout error:", errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
      setLoading(false);
    }
  };

  const effectiveAmount = discountInfo?.finalAmount || amount;

  return (
    <div className="space-y-4">
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
        disabled={loading || !amount || amount <= 0}
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
