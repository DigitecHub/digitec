'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import '../styles/PaymentLogs.css';

export default function PaymentLogs() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!user) {
          setError('Please sign in to view payment logs');
          setLoading(false);
          return;
        }

        setUser(user);

        // Fetch payments with course details
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            courses (
              title,
              image_url
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPayments(data);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Failed to fetch payment logs: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();

    // Set up real-time subscription for new payments
    const subscription = supabase
      .channel('payments')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'payments',
          filter: `user_id=eq.${user?.id}`
        }, 
        (payload) => {
          setPayments((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [supabase]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <FaCheckCircle className="status-icon success" />;
      case 'failed':
        return <FaTimesCircle className="status-icon failed" />;
      case 'insufficient_amount':
        return <FaExclamationTriangle className="status-icon warning" />;
      case 'enrollment_failed':
        return <FaExclamationTriangle className="status-icon warning" />;
      case 'pending':
        return <FaSpinner className="status-icon spinner" />;
      case 'cancelled':
        return <FaTimesCircle className="status-icon failed" />;
      default:
        return <FaSpinner className="status-icon spinner" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'Successful';
      case 'failed':
        return 'Failed';
      case 'insufficient_amount':
        return 'Insufficient Amount';
      case 'enrollment_failed':
        return 'Enrollment Failed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="payment-logs-container">
        <div className="loading-state">
          <FaSpinner className="spinner" />
          <p>Loading payment logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-logs-container">
        <div className="error-state">
          <FaTimesCircle className="error-icon" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-logs-container">
      <div className="payment-logs-header">
        <h2>Payment History</h2>
        <p>Track all your course payments and transactions</p>
      </div>

      {payments.length === 0 ? (
        <div className="empty-state">
          <p>No payments found. Make your first course purchase to see payment history here.</p>
        </div>
      ) : (
        <div className="payments-grid">
          {payments.map((payment) => (
            <div key={payment.id} className="payment-card">
              <div className="payment-header">
                <div className="payment-status">
                  {getStatusIcon(payment.payment_status)}
                  <span className={`status-text ${payment.payment_status}`}>
                    {getStatusText(payment.payment_status)}
                  </span>
                </div>
                <div className="payment-amount">
                  ₦{payment.amount.toLocaleString()}
                </div>
              </div>

              <div className="payment-details">
                <div className="course-info">
                  {payment.courses && (
                    <>
                      <h4>{payment.courses.title}</h4>
                      <p>{payment.sub_course_ids?.length || 0} module(s) purchased</p>
                    </>
                  )}
                </div>

                <div className="payment-meta">
                  <div className="meta-item">
                    <span className="meta-label">Reference:</span>
                    <span className="meta-value">{payment.paystack_reference}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">
                      {new Date(payment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
