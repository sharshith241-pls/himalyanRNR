"use client";

import { useState } from "react";
import { createOrder, initiatePayment, verifyPayment } from "@/utils/razorpay/client";

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
      // Step 1: Create order on backend
      const orderData = await createOrder(trekId, amount, userEmail, userName);

      if (!orderData?.id) {
        throw new Error("Failed to initialize payment. Please try again.");
      }

      // Step 2: Verify Razorpay script is loaded
      if (typeof window === "undefined" || !window.Razorpay) {
        throw new Error("Payment service is unavailable. Please try again later.");
      }

      // Step 3: Initiate Razorpay payment
      const response = await new Promise((resolve, reject) => {
        try {
          const razorpay = new window.Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            order_id: orderData.id,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Himalayan Runners",
            description: `Trek Booking: ${trekTitle}`,
            prefill: {
              name: userName,
              email: userEmail,
            },
            theme: {
              color: "#10b981",
            },
            handler: async (response: any) => {
              try {
                // Validate response from Razorpay
                if (!response?.razorpay_payment_id || !response?.razorpay_signature) {
                  throw new Error("Invalid payment response. Please contact support.");
                }

                // Step 4: Verify payment on backend
                const verificationResult = await verifyPayment(
                  orderData.id,
                  response.razorpay_payment_id,
                  response.razorpay_signature
                );

                if (verificationResult?.success) {
                  resolve({
                    success: true,
                    data: verificationResult,
                  });
                } else {
                  throw new Error(verificationResult?.error || "Payment verification failed");
                }
              } catch (err: any) {
                reject(err);
              }
            },
            modal: {
              ondismiss: () => {
                reject(new Error("Payment cancelled by user"));
              },
              confirm_close: true,
            },
            retry: {
              enabled: true,
              max_count: 3,
            },
          });

          razorpay.open();
        } catch (err) {
          reject(err);
        }
      });

      if ((response as any)?.success) {
        onSuccess?.((response as any).data);
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Payment failed. Please try again.";
      console.error("Checkout error:", errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
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
