"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaPlay, FaArrowLeft, FaLock, FaCheck, FaUsers, FaClock, FaChartBar, FaChevronUp } from 'react-icons/fa';
import '../../../styles/CourseDetail.css';

export default function CourseDetailPage({ params }) {
  const { courseId } = params;
  const [course, setCourse] = useState(null);
  const [subCourses, setSubCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolledSubCourses, setEnrolledSubCourses] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user (if authenticated)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        // Only set user if successfully authenticated, otherwise leave as null for public access
        if (!userError && user) {
          setUser(user);
        } else {
          setUser(null);
        }
        
        // Get course details with pricing
        const { data: courseData, error: courseError } = await supabase
          .rpc('get_course_details_with_pricing', { p_course_id: courseId })
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Also fetch sub-courses to display them
        const { data: subCoursesData, error: subCoursesError } = await supabase
          .from('sub_courses')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (subCoursesError) throw subCoursesError;
        setSubCourses(subCoursesData);
        
        // Check if user is enrolled
        if (user) {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', courseId);
            
          if (!enrollmentError && enrollmentData && enrollmentData.length > 0) {
            setIsEnrolled(true);
            
            // Get enrolled sub-courses
            const { data: subEnrollmentData, error: subEnrollmentError } = await supabase
              .from('sub_course_enrollments')
              .select('sub_course_id')
              .eq('user_id', user.id)
              .eq('course_id', courseId);
              
            if (!subEnrollmentError && subEnrollmentData) {
              const enrolledIds = subEnrollmentData.map(item => item.sub_course_id);
              setEnrolledSubCourses(enrolledIds);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();

    // Scroll event listener for scroll-to-top button
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [courseId, supabase]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleEnrollClick = () => {
    if (!user) {
      router.push(`/auth/signin?redirect=/enrollment/${courseId}`);
    } else {
      router.push(`/enrollment/${courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="course-detail-loading">
        <div className="spinner"></div>
        <p>Loading course details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="course-detail-error">
        <h2>Something went wrong</h2>
        <p>{error || 'Course not found'}</p>
        <Link href="/courses" className="back-to-courses">
          Back to Courses
        </Link>
      </div>
    );
  }

  const formatPrice = (price, currency = 'NGN') => {
    if (price === null || price === undefined) return 'Free';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="course-detail-container">
      <div className="course-detail-header">
        <Link href="/courses" className="back-link">
          <FaArrowLeft /> Back to Courses
        </Link>
        <h1>{course.title}</h1>
        <p className="course-description">{course.description}</p>
        <div className="course-meta">
          <div className="meta-item">
            <FaUsers className="meta-icon" />
            <span>Beginner to Advanced</span>
          </div>
          <div className="meta-item">
            <FaClock className="meta-icon" />
            <span>{course.duration}</span>
          </div>
          <div className="meta-item">
            <FaChartBar className="meta-icon" />
            <span>{course.level}</span>
          </div>
        </div>
      </div>
      
      <div className="course-detail-content">
        <div className="course-main">
          <div className="course-preview">
            {showVideo && course.video_url ? (
              <div className="video-container">
                <iframe 
                  src={course.video_url}
                  title={course.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div 
                className="preview-image-container"
                onClick={() => course.video_url && setShowVideo(true)}
              >
                <Image 
                  src={course.image_url || '/course-placeholder.jpg'} 
                  alt={course.title} 
                  width={800} 
                  height={450} 
                  layout="responsive"
                  className="preview-image"
                />
                {course.video_url && (
                  <div className="play-button-overlay">
                    <div className="play-button">
                      <FaPlay />
                    </div>
                    <span className="play-text">Watch Preview</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="course-modules">
            <h2>Course Modules</h2>
            <div className="sub-courses-list">
              {subCourses.map((subCourse, index) => {
                const isSubCourseEnrolled = enrolledSubCourses.includes(subCourse.id);
                
                return (
                  <div key={subCourse.id} className="sub-course-item">
                    <div className="sub-course-header">
                      <div className="sub-course-index">{index + 1}</div>
                      <div className="sub-course-info">
                        <h3>{subCourse.title}</h3>
                        <p>{subCourse.description}</p>
                        <div className="sub-course-meta">
                          <span className="sub-course-duration">{subCourse.duration}</span>
                          {subCourse.video_url && (
                            <span className="sub-course-video">
                              <FaPlay className="video-icon" /> Video included
                            </span>
                          )}
                        </div>
                      </div>
                      {isEnrolled ? (
                        isSubCourseEnrolled ? (
                          <div className="sub-course-status enrolled">
                            <FaCheck /> Enrolled
                          </div>
                        ) : (
                          <div className="sub-course-status not-enrolled">
                            Not Enrolled
                          </div>
                        )
                      ) : (
                        <div className="sub-course-status locked">
                          <FaLock /> Locked
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="course-sidebar">
          <div className="enrollment-card">
            <div className="price-section">
              <h3>Course Price</h3>
              <div className="price">
                {course.is_completely_free
                  ? 'Free'
                  : `Starting from ${formatPrice(course.min_price, course.currency)}`}
              </div>
            </div>
            
            <div className="enrollment-info">
              <div className="info-item">
                <FaUsers className="info-icon" />
                <div className="info-text">
                  <span className="info-label">Students</span>
                  <span className="info-value">500+</span>
                </div>
              </div>
              <div className="info-item">
                <FaClock className="info-icon" />
                <div className="info-text">
                  <span className="info-label">Duration</span>
                  <span className="info-value">{course.duration}</span>
                </div>
              </div>
              <div className="info-item">
                <FaChartBar className="info-icon" />
                <div className="info-text">
                  <span className="info-label">Level</span>
                  <span className="info-value">{course.level}</span>
                </div>
              </div>
            </div>
            
            {isEnrolled ? (
              <Link href={`/courses/learn/${courseId}`} className="continue-btn">
                Continue Learning
              </Link>
            ) : (
              <button 
                onClick={handleEnrollClick} 
                className="enroll-btn"
              >
                {user ? 'Enroll Now' : 'Sign In to Enroll'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {showScrollTop && (
        <button 
          className="scroll-to-top" 
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <FaChevronUp />
        </button>
      )}
    </div>
  );
} 