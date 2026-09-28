import Link from "next/link";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <section className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-teal-700">Himalayan Runners</p>
        <h1 className="mb-6 text-3xl font-black text-gray-900">Secure checkout</h1>
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-800">
          <div className="flex justify-between gap-4"><span>Selected trek</span><strong>Selected Trek</strong></div>
          <div className="mt-2 flex justify-between gap-4"><span>Total amount</span><strong>INR 7,500</strong></div>
        </div>
        <p className="text-sm leading-6 text-gray-600">Payments are processed securely through Razorpay. You will be redirected to Razorpay Checkout to complete your payment.</p>
        <p className="mt-4 text-xs leading-5 text-gray-500">Please review the trek, amount, and payment terms before continuing. A booking confirmation is shown after Razorpay confirms the payment.</p>
        <Link href="/treks" className="mt-6 block rounded-lg bg-teal-600 px-4 py-3 text-center font-bold text-white hover:bg-teal-700">
          Choose a trek to continue
        </Link>
      </section>
    </main>
  );
}
