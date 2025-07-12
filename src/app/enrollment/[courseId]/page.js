"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft, FaCheck, FaSpinner, FaPlay } from 'react-icons/fa';
import '../../../styles/Enrollment.css';

export default function EnrollmentPage({ params }) {
  const { courseId } = params;
  const [course, setCourse] = useState(null);
  const [subCourses, setSubCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedSubCourses, setSelectedSubCourses] = useState([]);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!user) {
          // Redirect to sign in if not authenticated
          router.push(`/auth/signin?redirect=/enrollment/${courseId}`);
          return;
        }
        
        setUser(user);
        
        // Get course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
          
        if (courseError) throw courseError;
        setCourse(courseData);
        
        // Get sub-courses
        const { data: subCoursesData, error: subCoursesError } = await supabase
          .from('sub_courses')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });
          
        if (subCoursesError) throw subCoursesError;
        setSubCourses(subCoursesData);
        
        // Check if user is already enrolled
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId);
          
        if (enrollmentError) throw enrollmentError;
        
        if (enrollmentData && enrollmentData.length > 0) {
          // User already enrolled, redirect to course learning page
          router.push(`/courses/learn/${courseId}`);
          return;
        }
        
        // Don't pre-select all sub-courses, let the user choose
        if (subCoursesData && subCoursesData.length > 0) {
          // We'll let users select which ones they want
          setSelectedSubCourses([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [courseId, router, supabase]);

  const toggleSubCourseSelection = (subCourseId) => {
    setSelectedSubCourses(prev => {
      if (prev.includes(subCourseId)) {
        return prev.filter(id => id !== subCourseId);
      } else {
        return [...prev, subCourseId];
      }
    });
  };

  const handleEnrollment = async () => {
    if (selectedSubCourses.length === 0) {
      setError('Please select at least one sub-course to enroll');
      return;
    }
    
    setEnrolling(true);
    setError(null);
    
    try {
      // Create main course enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          enrollment_date: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single();
        
      if (enrollmentError) throw enrollmentError;
      
      // Create sub-course enrollments
      const subCourseEnrollments = selectedSubCourses.map(subCourseId => ({
        enrollment_id: enrollmentData.id,
        user_id: user.id,
        course_id: courseId,
        sub_course_id: subCourseId,
        status: 'not_started'
      }));
      
      const { error: subEnrollmentError } = await supabase
        .from('sub_course_enrollments')
        .insert(subCourseEnrollments);
        
      if (subEnrollmentError) throw subEnrollmentError;
      
      setSuccess(true);
      
      // Check if user enrolled in all available sub-courses
      const allSubCoursesSelected = selectedSubCourses.length === subCourses.length;
      
      // Redirect to learning page if all sub-courses are selected, otherwise to dashboard
      setTimeout(() => {
        if (allSubCoursesSelected) {
          router.push(`/courses/learn/${courseId}`);
        } else {
          router.push('/dashboard');
        }
      }, 2000);
    } catch (error) {
      console.error('Error during enrollment:', error);
      setError(error.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="enrollment-loading">
        <div className="spinner"></div>
        <p>Loading enrollment details...</p>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="enrollment-error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <Link href="/courses" className="back-to-courses">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="enrollment-container">
      <div className="enrollment-header">
        <Link href="/courses" className="back-link">
          <FaArrowLeft /> Back to Courses
        </Link>
        <h1>Enroll in Course</h1>
      </div>
      
      {success ? (
        <div className="enrollment-success">
          <div className="success-icon">✓</div>
          <h2>Enrollment Successful!</h2>
          <p>You have successfully enrolled in {course.title}.</p>
          <p>Redirecting to your dashboard...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="enrollment-alert error">
              <p>{error}</p>
            </div>
          )}
          
          <div className="enrollment-content">
            <div className="course-overview">
              <div className="course-image">
                <Image 
                  src={course?.image_url || '/course-placeholder.jpg'} 
                  alt={course?.title} 
                  width={500} 
                  height={300} 
                  layout="responsive"
                />
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
                <p><strong>Note:</strong> You can enroll in specific modules now or all at once. If you enroll in all modules, you'll be redirected to the learning page immediately after enrollment.</p>
              </div>
              
              <div className="sub-courses-list">
                {subCourses.map((subCourse) => (
                  <div 
                    key={subCourse.id} 
                    className={`sub-course-item ${selectedSubCourses.includes(subCourse.id) ? 'selected' : ''}`}
                    onClick={() => toggleSubCourseSelection(subCourse.id)}
                  >
                    <div className="checkbox">
                      {selectedSubCourses.includes(subCourse.id) && <FaCheck />}
                    </div>
                    <div className="sub-course-info">
                      <h4>{subCourse.title}</h4>
                      <p>{subCourse.description}</p>
                      <div className="sub-course-meta">
                        <span className="sub-course-duration">{subCourse.duration}</span>
                        {subCourse.video_url && (
                          <span className="sub-course-video">
                            <FaPlay className="video-icon" /> Preview available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="enrollment-actions">
                <p className="enrollment-note">
                  <strong>Note:</strong> All courses are currently free for testing purposes.
                </p>
                <button 
                  className="enroll-button" 
                  onClick={handleEnrollment}
                  disabled={enrolling || selectedSubCourses.length === 0}
                >
                  {enrolling ? (
                    <>
                      <FaSpinner className="spinner-icon" />
                      Enrolling...
                    </>
                  ) : (
                    'Enroll Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 