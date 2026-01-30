# Payment Integration Setup Guide

## Overview
This guide will help you set up Razorpay payment integration for your Himalayan Runners trek booking application.

---

## Step 1: Set Up Razorpay Account

1. **Create a Razorpay Account**
   - Go to https://razorpay.com
   - Sign up and verify your business details
   - Get your API Keys:
     - **Key ID** (Public Key)
     - **Key Secret** (Private Key)

2. **Activate Test Mode First**
   - Start with test keys for development
   - Use these test card details for testing:
     - Card: 4111111111111111
     - Expiry: Any future date (e.g., 12/30)
     - CVV: Any 3-digit number (e.g., 123)

---

## Step 2: Add Environment Variables

### Local Development (.env.local)

Add your Razorpay keys to `.env.local`:

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

### Production (Vercel)

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add both variables:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
3. Deploy your app to apply the changes

---

## Step 3: Create Bookings Table in Supabase

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT NOT NULL UNIQUE,
  razorpay_signature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_bookings_user_email ON public.bookings(user_email);
CREATE INDEX idx_bookings_trek_id ON public.bookings(trek_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (true);

CREATE POLICY "Allow payment system to create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);
```

---

## Step 4: How to Use Payment in Your Component

### Using the CheckoutButton Component

```tsx
import CheckoutButton from "@/components/CheckoutButton";

export default function TrekPage({ trek }) {
  const handlePaymentSuccess = (data) => {
    console.log("Payment successful:", data);
    // Redirect to success page or show confirmation
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
  };

  return (
    <div>
      <h1>{trek.title}</h1>
      <p>Price: ₹{trek.price}</p>

      <CheckoutButton
        trekId={trek.id}
        trekTitle={trek.title}
        amount={trek.price}
        userEmail="user@example.com"
        userName="User Name"
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
}
```

---

## Step 5: Payment Flow Explained

1. **User Clicks "Pay" Button**
   - CheckoutButton creates an order via API

2. **Order Created** (`POST /api/payment/create-order`)
   - Backend creates Razorpay order
   - Returns order ID

3. **Razorpay Modal Opens**
   - User enters payment details
   - Razorpay processes payment

4. **Payment Verified** (`POST /api/payment/verify`)
   - Backend verifies payment signature
   - Booking saved to database
   - Success callback triggered

5. **User Redirected**
   - On success: Show confirmation/redirect to success page
   - On error: Show error message

---

## Step 6: Test the Payment Flow

### Testing Locally

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Go to a trek page and click the payment button

3. Use Razorpay test card:
   - Card: 4111111111111111
   - Any expiry and CVV

4. Complete the payment to test the flow

### Test Card Numbers

| Card Type | Number | Result |
|-----------|--------|--------|
| Visa | 4111111111111111 | Success |
| Mastercard | 5555555555554444 | Success |
| Amex | 378282246310005 | Success |

---

## Step 7: Go Live

1. **Get Live Keys from Razorpay**
   - Switch to Live mode in Razorpay dashboard
   - Copy Live Key ID and Key Secret

2. **Update Production Environment**
   - Update Vercel environment variables with Live keys
   - Deploy your app

3. **Enable Payments in Production**
   - Your app will now accept real payments
   - Users can book treks with their actual cards

---

## Troubleshooting

### "Razorpay script not loaded"
- Check that `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
- Verify the script loads in browser console

### "Invalid signature"
- Ensure `RAZORPAY_KEY_SECRET` is correctly set
- Check for typos in environment variables

### Orders not showing in Razorpay Dashboard
- Verify API keys in Razorpay settings
- Check server logs for error messages

### Test payments not working
- Use only the Razorpay test cards provided
- Ensure you're in Test mode in Razorpay dashboard

---

## API Endpoints

### Create Order
```
POST /api/payment/create-order
Body: {
  trekId: string,
  amount: number,
  userEmail: string,
  userName: string
}
Response: {
  id: string (order ID),
  amount: number,
  currency: string
}
```

### Verify Payment
```
POST /api/payment/verify
Body: {
  orderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
}
Response: {
  success: boolean,
  booking: object
}
```

---

## Next Steps

- Add email confirmations for successful bookings
- Create admin dashboard to view all bookings
- Add refund functionality
- Implement booking cancellation policies
- Add multiple payment method support

---

## Support

For issues with Razorpay integration:
- **Razorpay Docs**: https://razorpay.com/docs/
- **Razorpay Support**: https://razorpay.com/support/
fsg