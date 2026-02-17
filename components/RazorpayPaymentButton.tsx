"use client";

import { useState } from "react";

interface RazorpayPaymentButtonProps {
  trekId: string;
  trekTitle: string;
  amount: number;
  userEmail: string;
  userName: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
}

export default function RazorpayPaymentButton({
  trekId,
  trekTitle,
  amount,
  userEmail,
  userName,
  onSuccess,
  onError,
}: RazorpayPaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setError(null);
    setLoading(true);

    try {
      // Step 1: Create order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trekId,
          amount,
          userEmail,
          userName,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const orderData = await orderResponse.json();

      if (!orderData?.id) {
        throw new Error("Invalid order response from server");
      }

      // Step 2: Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        // Step 3: Open Razorpay Checkout
        const razorpayOptions = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Himalayan Runners",
          description: `Trek Booking: ${trekTitle}`,
          image: "/logoo.jpeg",
          prefill: {
            name: userName,
            email: userEmail,
          },
          theme: {
            color: "#10b981",
          },
          handler: async (paymentResponse: any) => {
            try {
              // Verify payment
              const verifyResponse = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: orderData.id,
                  razorpayPaymentId: paymentResponse.razorpay_payment_id,
                  razorpaySignature: paymentResponse.razorpay_signature,
                }),
              });

              if (!verifyResponse.ok) {
                const verifyError = await verifyResponse.json();
                throw new Error(verifyError.error || "Payment verification failed");
              }

              const verifyData = await verifyResponse.json();
              
              if (verifyData.success) {
                onSuccess?.(verifyData);
              } else {
                throw new Error(verifyData.error || "Payment verification failed");
              }
            } catch (err: any) {
              setError(err.message || "Payment verification failed");
              onError?.(err.message);
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              setError("Payment cancelled");
              onError?.("Payment cancelled");
            },
            confirm_close: true,
          },
          retry: {
            enabled: true,
            max_count: 3,
          },
        };

        // @ts-ignore
        const razorpay = new window.Razorpay(razorpayOptions);
        razorpay.open();
      };

      script.onerror = () => {
        setLoading(false);
        setError("Failed to load payment gateway");
        onError?.("Failed to load payment gateway");
      };

      document.body.appendChild(script);
    } catch (err: any) {
      setLoading(false);
      const errorMsg = err.message || "Payment failed. Please try again.";
      setError(errorMsg);
      onError?.(errorMsg);
      console.error("Payment error:", errorMsg);
    }
  };

  return (
    <div>
      <button
        onClick={handlePayment}
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

      {/* Razorpay Trust Badge */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 111.414 1.414L7.414 6l3.293 3.293a1 1 0 01-1.414 1.414l-4-4z" clipRule="evenodd" />
        </svg>
        <span>Secured by Razorpay</span>
      </div>
    </div>
  );
}
