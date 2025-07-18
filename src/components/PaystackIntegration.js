"use client";

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaSpinner, FaCreditCard, FaLock } from 'react-icons/fa';
import '../styles/PaystackIntegration.css';

const PaystackIntegration = ({ 
  courseId, 
  subCourseIds, 
  amount, 
  currency = 'NGN', 
  onPaymentSuccess, 
  onPaymentError,
  userEmail,
  courseName 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const supabase = createClientComponentClient();

  const generateReference = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `digitec_${timestamp}_${random}`;
  };

  const initializePayment = async () => {
    if (!userEmail || !amount || amount <= 0) {
      setError('Invalid payment details. Please try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to make a payment');
      }

      const reference = generateReference();

      // Check if Paystack is already loaded
      if (window.PaystackPop) {
        initializePaystackHandler(user, reference);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      
      script.onload = () => {
        initializePaystackHandler(user, reference);
      };

      script.onerror = () => {
        setError('Failed to load payment system. Please check your internet connection.');
        setLoading(false);
      };

      document.body.appendChild(script);

    } catch (error) {
      console.error('Payment initialization error:', error);
      setError(error.message || 'Failed to initialize payment');
      setLoading(false);
      if (onPaymentError) {
        onPaymentError(error.message);
      }
    }
  };

  const handlePaymentVerification = async (response) => {
    try {
      const verifyRes = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reference: response.reference,
          courseId,
          subCourseIds
        }),
      });

      const verifyData = await verifyRes.json();
      
      if (verifyData.status === 'success') {
        setSuccess(`Payment successful! Reference: ${response.reference}`);
        if (onPaymentSuccess) {
          onPaymentSuccess(response.reference, verifyData.data);
        }
      } else {
        throw new Error(verifyData.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setError('Payment verification failed: ' + error.message);
      if (onPaymentError) {
        onPaymentError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const initializePaystackHandler = (user, reference) => {
    try {
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: userEmail,
        amount: parseInt(amount) * 100,
        currency: currency,
        ref: reference,
        metadata: {
          course_name: courseName,
          sub_course_ids: subCourseIds,
          course_id: courseId,
          user_id: user.id
        },
        callback: (response) => {
          // Handle payment verification asynchronously
          handlePaymentVerification(response);
        },
        onClose: () => {
          setLoading(false);
          if (!success) {
            setError('Payment window was closed. Please try again.');
          }
        },
      });
      
      handler.openIframe();
    } catch (error) {
      console.error('Paystack handler error:', error);
      setError('Failed to initialize payment handler.');
      setLoading(false);
      if (onPaymentError) {
        onPaymentError(error.message);
      }
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="paystack-integration">
      <div className="payment-card">
        <div className="payment-header">
          <FaCreditCard className="payment-icon" />
          <h3>Complete Your Enrollment</h3>
        </div>
        
        <div className="payment-details">
          <div className="course-info">
            <h4>{courseName}</h4>
            <p className="amount">{formatAmount(amount)}</p>
          </div>
          
          <div className="security-info">
            <FaLock className="security-icon" />
            <span>Secured by Paystack</span>
          </div>
        </div>

        {error && (
          <div className="payment-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="payment-message success">
            {success}
          </div>
        )}

        <button
          onClick={initializePayment}
          disabled={loading || !userEmail || !amount}
          className={`payment-button ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <FaSpinner className="spinner" />
              Processing...
            </>
          ) : (
            <>
              <FaCreditCard />
              Pay {formatAmount(amount)}
            </>
          )}
        </button>

        <div className="payment-info">
          <p>• Secure payment with Paystack</p>
          <p>• Instant access after payment</p>
          <p>• 30-day money-back guarantee</p>
        </div>
      </div>
    </div>
  );
};

export default PaystackIntegration;
