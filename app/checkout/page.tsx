export default function CheckoutPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "500px" }}>
      <h1>Checkout</h1>

      <p><strong>Trek:</strong> Selected Trek</p>
      <p><strong>Price:</strong> ₹7,500</p>

      <input placeholder="Coupon Code" />
      <br /><br />

      <button>Proceed to Payment</button>
    </main>
  );
}
