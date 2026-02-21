"use client";

import { useState } from "react";

interface CheckoutProps {
  trekId: string;
  trekTitle: string;
  amount: number;
  userEmail: string;
  userName: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
}

export default function CheckoutButton({
  trekId,
  trekTitle,
  amount,
  userEmail,
  userName,
  onSuccess,
  onError,
}: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      window.location.href = paymentData.short_url;
    } catch (err: any) {
      const errorMessage = err?.message || "Payment failed. Please try again.";
      console.error("Checkout error:", errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading || !amount || amount <= 0}
        className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
        aria-label={`Pay ₹${amount.toLocaleString("en-IN")} for ${trekTitle}`}
      >
        {loading ? (
          <>
            <span className="inline-block animate-spin">⏳</span>
            Processing...
          </>
        ) : (
          <>
            <span>💳</span>
            Pay ₹{amount.toLocaleString("en-IN")}
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
