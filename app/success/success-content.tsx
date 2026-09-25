"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { jsPDF } from "jspdf";

interface PaymentInfo {
  trekId?: string;
  trekTitle?: string;
  amount?: number;
  discountAmount?: number;
  finalAmount?: number;
  couponCode?: string;
  paymentType?: "advance" | "full";
  hasFullAccess?: boolean;
  bookingId?: string;
  slotDate?: string;
  userName?: string;
  userEmail?: string;
  paymentId?: string;
}

interface BookedTrek {
  duration?: string;
  difficulty?: string;
  location?: string;
}

interface ContactPerson {
  guide_name: string;
  guide_email?: string | null;
  guide_phone?: string | null;
  guide_notes?: string | null;
}

interface GeneratedCoupon {
  code: string;
  discountPercentage: number;
  validFor: string;
  expiryDate: string;
}

export function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [generatedCoupon, setGeneratedCoupon] = useState<GeneratedCoupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [bookedTrek, setBookedTrek] = useState<BookedTrek | null>(null);
  const [contactPerson, setContactPerson] = useState<ContactPerson | null>(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        // Try to get payment info from URL (production with callback)
        const paymentLinkId = searchParams.get("razorpay_payment_link_id");
        const paymentId = searchParams.get("razorpay_payment_id");
        const status = searchParams.get("razorpay_payment_link_status");
        const paymentLinkReferenceId = searchParams.get("razorpay_payment_link_reference_id");
        const paymentLinkSignature = searchParams.get("razorpay_payment_link_signature");

        // Get payment info from session storage (set before redirect)
        const storedInfo = sessionStorage.getItem("paymentInfo");
        const storedPaymentInfo = storedInfo ? JSON.parse(storedInfo) : null;

        // In development: success if we have storedInfo
        // In production: success if payment was marked as paid
        const isSuccess = status === "paid" && paymentLinkId && paymentId;

        if (!isSuccess) {
          setError("Payment was not completed successfully");
          setLoading(false);
          return;
        }

        const confirmationResponse = await fetch("/api/payment/confirm-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentLinkId,
            paymentId,
            paymentLinkReferenceId,
            paymentLinkStatus: status,
            paymentLinkSignature,
          }),
        });
        const confirmation = await confirmationResponse.json();
        if (!confirmationResponse.ok || !confirmation.success) {
          throw new Error(confirmation.error || "Payment verification failed");
        }

        // Use stored info only after the server has confirmed payment
        const confirmedPaymentInfo: PaymentInfo = {
          ...(storedPaymentInfo || {}),
          trekId: storedPaymentInfo?.trekId || confirmation.booking.trek_id,
          trekTitle: storedPaymentInfo?.trekTitle || confirmation.booking.trek_title,
          amount: storedPaymentInfo?.amount || confirmation.booking.amount,
          userName: storedPaymentInfo?.userName || confirmation.booking.user_name,
          userEmail: storedPaymentInfo?.userEmail || confirmation.booking.user_email,
          paymentId: confirmation.booking.razorpay_payment_id || paymentId,
        };

        if (confirmedPaymentInfo.trekId) {
          setPaymentInfo({
            ...confirmedPaymentInfo,
            paymentType: confirmation.booking.payment_type,
            hasFullAccess: confirmation.booking.has_full_access,
            bookingId: confirmation.booking.id,
            slotDate: confirmation.booking.slot_date || storedPaymentInfo?.slotDate,
          });

          if (supabase) {
            const [{ data: trekData }, { data: contactData }] = await Promise.all([
              supabase.from("treks").select("duration, difficulty, location").eq("id", confirmedPaymentInfo.trekId).maybeSingle(),
              supabase.from("trek_guide_contacts").select("guide_name, guide_email, guide_phone, guide_notes").eq("trek_id", confirmedPaymentInfo.trekId).maybeSingle(),
            ]);
            setBookedTrek(trekData);
            setContactPerson(contactData);
          }

          // Only generate coupon if this is their first trek booking
          if (confirmedPaymentInfo.trekId && (paymentId || "local-payment")) {
            try {
              const couponResponse = await fetch("/api/coupon/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  trekId: confirmedPaymentInfo.trekId,
                  paymentId: paymentId || "dev-" + Date.now(), // Use payment ID or generate dev ID
                  amount: confirmedPaymentInfo.finalAmount || confirmedPaymentInfo.amount,
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

  const downloadConfirmationPdf = () => {
    if (!paymentInfo) return;

    const pdfDocument = new jsPDF();
    const pageWidth = pdfDocument.internal.pageSize.getWidth();
    const margin = 18;
    let y = 22;

    pdfDocument.setFillColor(0, 137, 123);
    pdfDocument.rect(0, 0, pageWidth, 12, "F");
    pdfDocument.setTextColor(17, 24, 39);
    pdfDocument.setFontSize(20);
    pdfDocument.setFont("helvetica", "bold");
    pdfDocument.text("Himalayan Runners", margin, y);
    y += 10;
    pdfDocument.setFontSize(16);
    pdfDocument.text("Trek Booking Confirmation", margin, y);
    y += 12;

    const addSection = (heading: string, rows: string[]) => {
      pdfDocument.setTextColor(0, 105, 92);
      pdfDocument.setFontSize(12);
      pdfDocument.setFont("helvetica", "bold");
      pdfDocument.text(heading, margin, y);
      y += 7;
      pdfDocument.setTextColor(31, 41, 55);
      pdfDocument.setFontSize(10);
      pdfDocument.setFont("helvetica", "normal");
      rows.forEach((row) => {
        const wrapped = pdfDocument.splitTextToSize(row, pageWidth - margin * 2);
        pdfDocument.text(wrapped, margin, y);
        y += wrapped.length * 5 + 2;
      });
      y += 4;
    };

    addSection("User Details", [
      `Name: ${paymentInfo.userName || "-"}`,
      `Email: ${paymentInfo.userEmail || "-"}`,
    ]);
    addSection("Trek Information", [
      `Trek: ${paymentInfo.trekTitle || "Trek"}`,
      `Duration: ${bookedTrek?.duration || "-"}`,
      `Difficulty: ${bookedTrek?.difficulty || "-"}`,
      `Location: ${bookedTrek?.location || "-"}`,
      `Selected slot: ${paymentInfo.slotDate ? new Date(`${paymentInfo.slotDate}T00:00:00`).toLocaleDateString("en-IN", { dateStyle: "long" }) : "-"}`,
    ]);
    addSection("Payment Information", [
      `Booking ID: ${paymentInfo.bookingId || "-"}`,
      `Payment ID: ${paymentInfo.paymentId || "-"}`,
      `Payment type: ${paymentInfo.paymentType === "full" ? "Full payment" : "Advance payment"}`,
      `Amount paid: INR ${(paymentInfo.finalAmount ?? paymentInfo.amount ?? 0).toLocaleString("en-IN")}`,
    ]);
    if (contactPerson) {
      addSection("Contact Person", [
        `Name: ${contactPerson.guide_name}`,
        `Email: ${contactPerson.guide_email || "-"}`,
        `Phone: ${contactPerson.guide_phone || "-"}`,
        `Important information: ${contactPerson.guide_notes || "-"}`,
      ]);
    }

    pdfDocument.setFontSize(9);
    pdfDocument.setTextColor(107, 114, 128);
    pdfDocument.text("Keep this confirmation ticket for your trek.", margin, Math.min(y + 5, 280));

    const pdfBlob = pdfDocument.output("blob");
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = window.document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `himalayan-runners-${paymentInfo.bookingId || "booking"}.pdf`;
    window.document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
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
          <button
            onClick={() => router.push("/")}
            className="mt-5 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            Return to Home
          </button>
        </div>

        {/* Payment Details */}
        {paymentInfo && (
          <div id="print-confirmation" className="bg-white rounded-lg shadow-lg p-8 mb-6">
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
              {paymentInfo.slotDate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trek Date</span>
                  <span className="font-semibold text-gray-800">{new Date(`${paymentInfo.slotDate}T00:00:00`).toLocaleDateString("en-IN", { dateStyle: "long" })}</span>
                </div>
              )}
              {bookedTrek && (
                <div className="grid gap-3 border-t pt-4 sm:grid-cols-3">
                  <div><p className="text-xs text-gray-500">Duration</p><p className="font-semibold text-gray-800">{bookedTrek.duration || "-"}</p></div>
                  <div><p className="text-xs text-gray-500">Difficulty</p><p className="font-semibold text-gray-800">{bookedTrek.difficulty || "-"}</p></div>
                  <div><p className="text-xs text-gray-500">Location</p><p className="font-semibold text-gray-800">{bookedTrek.location || "-"}</p></div>
                </div>
              )}
              {contactPerson && (
                <div className="border-t pt-4">
                  <h3 className="mb-2 font-bold text-gray-800">Contact Person</h3>
                  <p className="text-gray-700">{contactPerson.guide_name}</p>
                  {contactPerson.guide_email && <p className="text-gray-700">{contactPerson.guide_email}</p>}
                  {contactPerson.guide_phone && <p className="text-gray-700">{contactPerson.guide_phone}</p>}
                  {contactPerson.guide_notes && <p className="mt-2 whitespace-pre-line text-gray-700"><strong>Important Information:</strong> {contactPerson.guide_notes}</p>}
                </div>
              )}
            </div>
            <button type="button" onClick={downloadConfirmationPdf} className="no-print mt-5 w-full rounded-lg bg-teal-600 py-3 font-semibold text-white hover:bg-teal-700">Download confirmation PDF</button>
          </div>
        )}

        {paymentInfo && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Trek Access</h2>
            <p className="text-green-700 font-semibold">
              Payment completed. You have {paymentInfo.hasFullAccess ? "full access" : "reserved your place with an advance payment"} for {paymentInfo.trekTitle || "this trek"}.
            </p>
            {paymentInfo.trekId && (
              <button onClick={() => router.push(`/treks/${paymentInfo.trekId}`)} className="mt-4 bg-teal-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-teal-700">
                View your trek
              </button>
            )}
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
