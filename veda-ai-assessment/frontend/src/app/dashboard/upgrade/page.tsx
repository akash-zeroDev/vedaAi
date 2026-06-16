'use client';

import React, { useState } from 'react';
import { Heart, Zap, Infinity, ShieldCheck, ChevronRight, Crown, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Script from 'next/script';

export default function UpgradePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(500);

  type PaymentStatus = 'IDLE' | 'VERIFYING' | 'SUCCESS' | 'FAILED';
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('IDLE');
  const [paymentMessage, setPaymentMessage] = useState('');

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Create order on backend
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.max(customAmount * 100, 100) }) // Min 100 paise (1 INR)
      });
      const order = await res.json();

      if (!res.ok) throw new Error(order.error || 'Failed to create order');

      // 2. Open Razorpay modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Graphite Premium',
        description: 'Developer Support Donation',
        order_id: order.order_id,
        handler: async function (response: any) {
          try {
            setPaymentStatus('VERIFYING');
            setPaymentMessage('Verifying your payment securely...');

            // 3. Verify signature on backend
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              setPaymentStatus('SUCCESS');
              setPaymentMessage('Premium tier is coming soon. Thank you for your support!');
            } else {
              setPaymentStatus('FAILED');
              setPaymentMessage('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Verification error:', error);
            setPaymentStatus('FAILED');
            setPaymentMessage('An error occurred during verification.');
          }
        },
        theme: {
          color: '#0f172a' // slate-900
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment Failed:', response.error);
        setPaymentStatus('FAILED');
        setPaymentMessage(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error) {
      console.error('Checkout error:', error);
      setPaymentStatus('FAILED');
      setPaymentMessage('Failed to initiate checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* ── Custom Payment Status Modal ── */}
      {paymentStatus !== 'IDLE' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200 p-8 max-w-sm w-full flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            {paymentStatus === 'VERIFYING' && <Loader2 size={56} className="animate-spin text-amber-500 mb-5" />}
            {paymentStatus === 'SUCCESS' && <CheckCircle2 size={56} className="text-emerald-500 mb-5" />}
            {paymentStatus === 'FAILED' && <XCircle size={56} className="text-rose-500 mb-5" />}
            
            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
              {paymentStatus === 'VERIFYING' && 'Verifying Payment...'}
              {paymentStatus === 'SUCCESS' && 'Thank You!'}
              {paymentStatus === 'FAILED' && 'Payment Failed'}
            </h3>
            
            <p className="text-sm text-slate-500 mb-8 leading-relaxed px-2">{paymentMessage}</p>
            
            {paymentStatus !== 'VERIFYING' && (
              <button
                onClick={() => setPaymentStatus('IDLE')}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors shadow-sm"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col w-full max-w-[1000px] mx-auto gap-12 pb-16 pt-8 px-4 lg:px-8">
      {/* ── Hero Section ── */}
      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-widest">
          <Crown size={14} className="text-amber-500" /> Early Access
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
          Graphite Premium is coming soon.
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
          We are currently running on a free, rate-limited tier to keep the platform accessible.
          Support the developer to help us unlock the high-speed production servers and launch the
          Premium tier faster.
        </p>
      </div>

      {/* ── Pricing / Feature Comparison ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Free Tier Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Current Free Tier</h2>
            <p className="text-sm text-slate-500">The baseline experience for early adopters.</p>
          </div>
          <div className="text-4xl font-bold text-slate-900 mb-8">$0<span className="text-lg text-slate-400 font-normal">/mo</span></div>
          <ul className="flex flex-col gap-4 text-sm text-slate-600 flex-grow mb-8">
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Standard AI Processing Speed</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> 15 Requests per minute (Rate Limited)</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Basic Data Caching</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Community Support</li>
          </ul>
          <button disabled className="w-full py-3 px-4 bg-slate-100 text-slate-400 font-semibold rounded-xl cursor-not-allowed">
            Current Plan
          </button>
        </div>

        {/* Target Premium Tier Card */}
        <div className="bg-slate-50 border border-slate-800 rounded-3xl p-8 flex flex-col relative overflow-hidden shadow-xl shadow-slate-200/50">
          {/* Subtle glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-200 rounded-full blur-3xl opacity-50 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Target Premium Tier</h2>
                <p className="text-sm text-slate-500">The high-performance production goal.</p>
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-8">TBA</div>
            <ul className="flex flex-col gap-4 text-sm text-slate-700 flex-grow mb-8 font-medium">
              <li className="flex items-center gap-3"><Zap size={16} className="text-slate-900" /> Zero API Rate Limits</li>
              <li className="flex items-center gap-3"><Infinity size={16} className="text-slate-900" /> Instant Redis Queues</li>
              <li className="flex items-center gap-3"><FileText size={16} className="text-slate-900" /> Advanced PDF Extraction & OCR</li>
              <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-slate-900" /> Priority Developer Support</li>
            </ul>
            <div className="mt-8">
              <button
                disabled
                className="w-full py-3.5 px-4 bg-slate-200 text-slate-400 font-semibold rounded-xl cursor-not-allowed shadow-inner"
              >
                Available Soon
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Support & Donation Section ── */}
      <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-8 max-w-2xl mx-auto text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-50 text-rose-500 rounded-full mb-4">
          <Heart size={24} />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Support the Project</h3>
        <p className="text-slate-500 mb-6 text-sm">
          Donations directly fund our AWS and LLM infrastructure. Help us unlock the high-speed production servers and launch the Premium tier faster.
        </p>

        <div className="max-w-xs mx-auto mb-4 text-left">
          <label htmlFor="donationAmount" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Custom Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-lg">₹</span>
            <input
              type="number"
              id="donationAmount"
              min="10"
              step="50"
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value) || 0)}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-lg shadow-sm"
              placeholder="500"
            />
          </div>
        </div>
        
        <button
          onClick={handlePayment}
          disabled={isProcessing || customAmount < 10}
          className="group flex items-center justify-center gap-2 max-w-xs w-full mx-auto py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {isProcessing ? (
            <Loader2 size={16} className="animate-spin text-slate-400" />
          ) : (
            <Heart size={16} className="text-rose-400 group-hover:scale-110 transition-transform" />
          )}
          {isProcessing ? 'Processing...' : `Donate ₹${customAmount || 10}`}
        </button>
        <p className="text-[11px] text-slate-400 mt-4">
          Supports UPI (GPay, PhonePe, Paytm) & Indian Debit/Credit Cards
        </p>
      </div>

      {/* ── FAQ Section ── */}
      <div className="mt-8 border-t border-slate-200 pt-12">
        <h3 className="text-xl font-bold text-slate-900 mb-8 tracking-tight">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Why donate?</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Graphite relies on heavy LLM processing and AWS cloud storage to provide instant, high-quality grading rubrics and difficulty matrices. Donations directly fund the server costs required to keep the site online and accessible for everyone.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">What happens when Premium launches?</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Early supporters who donate to the project will be granted complimentary lifetime access to the Premium tier once the Stripe integration goes live and the rate limits are officially lifted.
            </p>
          </div>
        </div>
      </div>

    </div>
    </>
  );
}
