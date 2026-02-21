// Razorpay payment utility - Hosted Checkout

export const createOrder = async (
  trekId: string,
  amount: number,
  userEmail: string,
  userName: string
) => {
  try {
    const response = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trekId,
        amount,
        userEmail,
        userName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create payment link");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating payment link:", error);
    throw error;
  }
};

export const redirectToPayment = async (
  trekId: string,
  amount: number,
  userEmail: string,
  userName: string
) => {
  try {
    const paymentData = await createOrder(trekId, amount, userEmail, userName);
    
    if (!paymentData?.short_url) {
      throw new Error("Payment link not generated");
    }

    // Redirect to Razorpay hosted checkout
    window.location.href = paymentData.short_url;
  } catch (error) {
    console.error("Error redirecting to payment:", error);
    throw error;
  }
};
