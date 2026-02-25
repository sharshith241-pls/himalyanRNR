"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface PaymentInfo {
  trekId?: string;
  trekTitle?: string;
  amount?: number;
  discountAmount?: number;
  finalAmount?: number;
  couponCode?: string;
}

interface GeneratedCoupon {
  code: string;
  discountPercentage: number;
  validFor: string;
  expiryDate: string;
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [generatedCoupon, setGeneratedCoupon] = useState<GeneratedCoupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        // Try to get payment info from URL (production with callback)
        const paymentLinkId = searchParams.get("razorpay_payment_link_id");
        const paymentId = searchParams.get("razorpay_payment_id");
        const status = searchParams.get("razorpay_payment_link_status");

        // Get payment info from session storage (set before redirect)
        const storedInfo = sessionStorage.getItem("paymentInfo");
        const paymentInfo = storedInfo ? JSON.parse(storedInfo) : null;

        // In development: success if we have storedInfo
        // In production: success if payment was marked as paid
        const isSuccess = storedInfo || status === "paid";

        if (!isSuccess) {
          setError("Payment was not completed successfully");
          setLoading(false);
          return;
        }

        // Use stored payment info
        if (paymentInfo) {
          setPaymentInfo(paymentInfo);

          // Only generate coupon if this is their first trek booking
          if (paymentInfo.trekId && (paymentId || "local-payment")) {
            try {
              const couponResponse = await fetch("/api/coupon/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  trekId: paymentInfo.trekId,
                  paymentId: paymentId || "dev-" + Date.now(), // Use payment ID or generate dev ID
                  amount: paymentInfo.finalAmount || paymentInfo.amount,
                }),
              });

              if (couponResponse.ok) {
                const couponData = await couponResponse.json();
                if (couponData.success && couponData.coupon) {
                  setGeneratedCoupon(couponData.coupon);
                }
              }
            } catch (couponError) {
              console.error("Failed to generate coupon:", couponError);
              // Don't block payment success if coupon generation fails
            }
          }

          // Clear session storage
          sessionStorage.removeItem("paymentInfo");
        } else {
          // No stored info found
          setError("Payment information not found. It may have been completed successfully.");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing payment success:", err);
        setError("Error processing payment confirmation");
        setLoading(false);
      }
    };

    initializePayment();
  }, [searchParams]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-teal-500 rounded-full"></div>
          </div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/treks")}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-4xl font-bold text-green-600 mb-2">Booking Successful!</h1>
          <p className="text-gray-600 text-lg">Your trek has been confirmed</p>
        </div>

        {/* Development Mode Notice */}
        {(typeof window !== "undefined" && window.location.hostname === "localhost") && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <p className="text-sm text-blue-800">
              <strong>💡 Development Mode:</strong> In production, you'll be automatically redirected here after payment. For now, you can manually navigate to this page to complete your booking confirmation.
            </p>
          </div>
        )}

        {/* Payment Details */}
        {paymentInfo && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Booking Details</h2>
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Trek</span>
                <span className="font-semibold text-gray-800">{paymentInfo.trekTitle || "Trek"}</span>
              </div>
              {paymentInfo.discountAmount && paymentInfo.discountAmount > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Original Amount</span>
                    <span className="font-semibold text-gray-800">
                      ₹{paymentInfo.amount?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="font-medium">Discount Applied</span>
                    <span className="font-bold">-₹{paymentInfo.discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Amount Paid</span>
                    <span className="text-lg font-bold text-green-600">
                      ₹{paymentInfo.finalAmount?.toLocaleString("en-IN")}
                    </span>
                  </div>
                </>
              )}
              {(!paymentInfo.discountAmount || paymentInfo.discountAmount === 0) && (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">Amount Paid</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{paymentInfo.amount?.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generated Coupon */}
        {generatedCoupon && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-8 mb-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">🎉 Your Exclusive Coupon</h2>
              <p className="text-gray-700 mb-4">
                Share this code with friends to get {generatedCoupon.discountPercentage}% off!
              </p>

              <div className="bg-white rounded-lg p-6 mb-4 border-4 border-blue-500">
                <p className="text-xs text-gray-500 mb-2">COUPON CODE</p>
                <p className="text-4xl font-bold text-blue-600 font-mono tracking-widest mb-2">
                  {generatedCoupon.code}
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(generatedCoupon.code)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition mb-2"
              >
                {copied ? "✓ Copied!" : "Copy Code"}
              </button>

              <div className="bg-white rounded p-4 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Valid for:</strong> {generatedCoupon.validFor}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Discount:</strong> {generatedCoupon.discountPercentage}%
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Expires:</strong> {new Date(generatedCoupon.expiryDate).toLocaleDateString()}
                </p>
              </div>

              <p className="text-xs text-gray-600 italic">
                Share this code: "I got {generatedCoupon.discountPercentage}% off with code{" "}
                <strong>{generatedCoupon.code}</strong> on Himalayan Runners!"
              </p>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">What's Next?</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-green-500 font-bold mr-3">✓</span>
              <span className="text-gray-700">A confirmation email has been sent to your email address</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 font-bold mr-3">✓</span>
              <span className="text-gray-700">Our team will contact you with trek details and itinerary</span>
            </li>
            {generatedCoupon && (
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span className="text-gray-700">
                  Share your coupon code with friends and earn referral benefits!
                </span>
              </li>
            )}
          </ul>

          <div className="mt-8 pt-8 border-t space-y-4">
            <button
              onClick={() => router.push("/treks")}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg transition"
            >
              Explore More Treks
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
