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

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create order
      const orderData = await createOrder(trekId, amount, userEmail, userName);

      if (!orderData.id) {
        throw new Error("Failed to create order");
      }

      // Step 2: Initiate Razorpay payment
      // @ts-ignore
      const response = await new Promise((resolve, reject) => {
        // @ts-ignore
        const razorpay = new window.Razorpay({
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Himalayan Runners",
          description: trekTitle,
          prefill: {
            name: userName,
            email: userEmail,
          },
          theme: {
            color: "#10b981",
          },
          handler: async (response: any) => {
            try {
              // Step 3: Verify payment
              const verificationResult = await verifyPayment(
                orderData.id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );

              if (verificationResult.success) {
                resolve({
                  success: true,
                  data: verificationResult,
                });
              } else {
                reject(new Error("Payment verification failed"));
              }
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled"));
            },
          },
        });

        razorpay.open();
      });

      if ((response as any).success) {
        onSuccess?.((response as any).data);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Payment failed";
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
        disabled={loading}
        className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
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
        </div>
      )}
    </div>
  );
}
