import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PaymentForm = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Call backend to create payment intent
      const res = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create payment intent');

      const clientSecret = data.clientSecret;
      const cardElement = elements.getElement(CardElement);
      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (paymentResult.error) {
        setError(paymentResult.error.message);
        if (onError) onError(paymentResult.error);
      } else if (paymentResult.paymentIntent.status === 'succeeded') {
        setSuccess(true);
        if (onSuccess) onSuccess(paymentResult.paymentIntent);
      }
    } catch (err) {
      setError(err.message);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <CardElement options={{ hidePostalCode: true }} className="mb-4" />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-pastel-blue text-white py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay'}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">Payment successful!</div>}
    </form>
  );
};

export default PaymentForm; 