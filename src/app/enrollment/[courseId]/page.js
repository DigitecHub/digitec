"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft, FaCheck, FaSpinner, FaPlay } from 'react-icons/fa';
import PaystackIntegration from '../../../components/PaystackIntegration';

import '../../../styles/Enrollment.css';

export default function EnrollmentPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [subCourses, setSubCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedSubCourses, setSelectedSubCourses] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [enrolledSubCourses, setEnrolledSubCourses] = useState([]);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          router.push(`/auth/signin?redirect=/enrollment/${courseId}`);
          return;
        }
        setUser(user);

        const { data: courseData, error: courseError } = await supabase.from('courses').select('*').eq('id', courseId).single();
        if (courseError) throw courseError;
        setCourse(courseData);

        const { data: subCoursesData, error: subCoursesError } = await supabase.from('sub_courses').select('*').eq('course_id', courseId).order('order_index', { ascending: true });
        if (subCoursesError) throw subCoursesError;
        setSubCourses(subCoursesData);

        const { data: subEnrollmentData, error: subEnrollmentError } = await supabase.from('sub_course_enrollments').select('sub_course_id').eq('user_id', user.id).eq('course_id', courseId);
        if (subEnrollmentError) throw subEnrollmentError;
        const currentlyEnrolled = subEnrollmentData.map(e => e.sub_course_id);
        setEnrolledSubCourses(currentlyEnrolled);

        if (subCoursesData.length > 0 && currentlyEnrolled.length === subCoursesData.length) {
          router.push(`/courses/learn/${courseId}`);
          return;
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [courseId, router, supabase]);

  useEffect(() => {
    const calculateTotal = () => {
      const total = selectedSubCourses.reduce((acc, subCourseId) => {
        const subCourse = subCourses.find(sc => sc.id === subCourseId);
        return acc + (subCourse?.price || 0);
      }, 0);
      setTotalPrice(total);
    };
    if (subCourses.length > 0) calculateTotal();
  }, [selectedSubCourses, subCourses]);

  const handlePaymentSuccess = (reference, paymentData) => {
    console.log('Payment successful on parent page:', reference, paymentData);
    setEnrolledSubCourses(prev => [...new Set([...prev, ...selectedSubCourses])]);
    setSelectedSubCourses([]);
    setSuccess(true);
    setShowPayment(false);
    setTimeout(() => setSuccess(false), 5000);
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
    setShowPayment(false);
  };

  const toggleSubCourseSelection = (subCourseId) => {
    if (enrolledSubCourses.includes(subCourseId)) return;
    setSelectedSubCourses(prev => 
      prev.includes(subCourseId) 
        ? prev.filter(id => id !== subCourseId) 
        : [...prev, subCourseId]
    );
  };

  const handleEnrollment = async () => {
    if (totalPrice > 0) {
      setShowPayment(true);
      return;
    }
    if (selectedSubCourses.length === 0) {
      setError('Please select at least one module to enroll.');
      return;
    }
    setEnrolling(true);
    setError(null);
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_enrollment_and_sub_enrollments', {
        p_user_id: user.id,
        p_course_id: courseId,
        p_sub_course_ids: selectedSubCourses
      });

      if (rpcError || (rpcResult && !rpcResult.success)) {
        throw new Error(rpcError?.message || rpcResult?.error || 'Failed to enroll.');
      }

      setEnrolledSubCourses(prev => [...new Set([...prev, ...selectedSubCourses])]);
      setSelectedSubCourses([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Error during free enrollment:', err);
      setError(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="enrollment-loading"><div className="spinner"></div><p>Loading enrollment details...</p></div>;
  }

  if (error && !course) {
    return <div className="enrollment-error"><h2>Something went wrong</h2><p>{error}</p><Link href="/courses" className="back-to-courses">Back to Courses</Link></div>;
  }

  return (
    <div className="enrollment-container">
      <div className="enrollment-header">
        <Link href="/courses" className="back-link"><FaArrowLeft /> Back to Courses</Link>
        <h1>Enroll in Course</h1>
      </div>
      <>
        {error && <div className="enrollment-alert error"><p>{error}</p></div>}
        {success && <div className="enrollment-alert success"><p>Enrollment successful! Your new modules are now available.</p></div>}
        <div className="enrollment-content">
          <div className="course-overview">
            <div className="course-image">
              <Image src={course?.image_url || '/course-placeholder.jpg'} alt={course?.title} width={500} height={300} style={{ width: '100%', height: 'auto' }}/>
            </div>
            <div className="course-details">
              <h2>{course?.title}</h2>
              <p className="course-description">{course?.description}</p>
              <div className="course-meta">
                <span className="course-category">{course?.category}</span>
                <span className="course-level">{course?.level}</span>
                <span className="course-duration">{course?.duration}</span>
              </div>
            </div>
          </div>
          <div className="sub-courses-section">
            <h3>Course Content</h3>
            <p>Select the modules you want to enroll in:</p>
            <div className="enrollment-info-box">
              <p><strong>Note:</strong> You can enroll in specific modules now or all at once.</p>
            </div>
            <div className="sub-courses-list">
              {subCourses.map((subCourse) => {
                const isEnrolled = enrolledSubCourses.includes(subCourse.id);
                const isSelected = selectedSubCourses.includes(subCourse.id);
                const isFree = !subCourse.price || subCourse.price === 0;
                return (
                  <div key={subCourse.id} className={`sub-course-item ${isSelected ? 'selected' : ''} ${isEnrolled ? 'enrolled' : ''}`} onClick={() => toggleSubCourseSelection(subCourse.id)}>
                    <div className="checkbox">
                      {isSelected && !isEnrolled && <FaCheck />}
                      {isEnrolled && <span className="enrolled-badge">Enrolled</span>}
                    </div>
                    <div className="sub-course-info">
                      <h4>{subCourse.title}</h4>
                      <p>{subCourse.description}</p>
                    </div>
                    <div className="sub-course-price">
                      {isFree ? 'Free' : `₦${subCourse.price}`}
                    </div>
                  </div>
                )
              })}
            </div>
            {showPayment ? (
              <PaystackIntegration
                courseId={courseId}
                subCourseIds={selectedSubCourses}
                amount={totalPrice}
                userEmail={user?.email}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            ) : (
              <div className="enrollment-summary">
                <div className="total-price">
                  <h3>Total</h3>
                  <p>₦{totalPrice.toLocaleString()}</p>
                </div>
                <button className="enroll-button" onClick={handleEnrollment} disabled={enrolling || selectedSubCourses.length === 0}>
                  {enrolling ? (<><FaSpinner className="spinner-icon" /> Processing...</>) : (totalPrice > 0 ? `Pay ₦${totalPrice.toLocaleString()}` : 'Enroll for Free')}
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    </div>
  );
} 