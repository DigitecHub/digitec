"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import PaystackIntegration from './PaystackIntegration';
import { FaLock, FaCheck, FaClock, FaUsers, FaStar } from 'react-icons/fa';
import '../styles/PaymentEnrollment.css';

const PaymentEnrollment = ({ 
  subCourse, 
  course, 
  onEnrollmentSuccess, 
  userEmail 
}) => {
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [user, setUser] = useState(null);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkEnrollmentStatus();
  }, [subCourse?.id]);

  const checkEnrollmentStatus = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      setUser(user);

      // Check if user is enrolled in this sub-course
      const { data: enrollment, error } = await supabase
        .from('sub_course_enrollments')
        .select('*, payments(*)')
        .eq('user_id', user.id)
        .eq('sub_course_id', subCourse.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking enrollment:', error);
        setEnrollmentStatus('error');
      } else if (enrollment) {
        setEnrollmentStatus('enrolled');
      } else {
        setEnrollmentStatus('not_enrolled');
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error);
      setEnrollmentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (reference, paymentData) => {
    // Refresh enrollment status
    await checkEnrollmentStatus();
    
    // Call parent callback
    if (onEnrollmentSuccess) {
      onEnrollmentSuccess(reference, paymentData);
    }
    
    setShowPayment(false);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // You can show a toast or error message here
  };

  const formatPrice = (price, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="payment-enrollment loading">
        <div className="loading-spinner">
          <FaClock className="spinner" />
          <p>Checking enrollment status...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="payment-enrollment">
        <div className="enrollment-card">
          <div className="enrollment-header">
            <FaLock className="lock-icon" />
            <h3>Login Required</h3>
          </div>
          <p>Please log in to enroll in this course.</p>
        </div>
      </div>
    );
  }

  if (enrollmentStatus === 'enrolled') {
    return (
      <div className="payment-enrollment">
        <div className="enrollment-card enrolled">
          <div className="enrollment-header">
            <FaCheck className="check-icon" />
            <h3>You're Enrolled!</h3>
          </div>
          <p>You have access to this course. Start learning now!</p>
        </div>
      </div>
    );
  }

  if (subCourse?.is_free || !subCourse?.payment_required) {
    return (
      <div className="payment-enrollment">
        <div className="enrollment-card free">
          <div className="enrollment-header">
            <FaCheck className="check-icon" />
            <h3>Free Course</h3>
          </div>
          <p>This course is free! Click below to enroll.</p>
          <button 
            className="enroll-button free"
            onClick={() => {
              // Handle free enrollment
              // You can implement this logic
            }}
          >
            Enroll for Free
          </button>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <PaystackIntegration
        subCourseId={subCourse.id}
        courseId={course.id}
        amount={subCourse.price}
        currency={subCourse.currency || 'NGN'}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        userEmail={userEmail}
        courseName={subCourse.title}
      />
    );
  }

  return (
    <div className="payment-enrollment">
      <div className="enrollment-card">
        <div className="course-preview">
          <div className="course-header">
            <h3>{subCourse.title}</h3>
            <div className="price-tag">
              {formatPrice(subCourse.price, subCourse.currency)}
            </div>
          </div>
          
          <p className="course-description">{subCourse.description}</p>
          
          <div className="course-features">
            <div className="feature">
              <FaClock />
              <span>{subCourse.duration}</span>
            </div>
            <div className="feature">
              <FaUsers />
              <span>Lifetime Access</span>
            </div>
            <div className="feature">
              <FaStar />
              <span>Certificate of Completion</span>
            </div>
          </div>
          
          <div className="enrollment-benefits">
            <h4>What you'll get:</h4>
            <ul>
              <li>✅ Complete course materials</li>
              <li>✅ Interactive lessons and quizzes</li>
              <li>✅ Downloadable resources</li>
              <li>✅ Certificate upon completion</li>
              <li>✅ 30-day money-back guarantee</li>
            </ul>
          </div>
          
          <button 
            className="enroll-button"
            onClick={() => setShowPayment(true)}
          >
            Enroll Now - {formatPrice(subCourse.price, subCourse.currency)}
          </button>
          
          <div className="security-note">
            <FaLock />
            <span>Secure payment powered by Paystack</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentEnrollment;
