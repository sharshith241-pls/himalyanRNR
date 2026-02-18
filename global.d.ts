interface RazorpayOptions {
  key_id: string | undefined;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  handler: (response: any) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open(): void;
  close(): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export {};
