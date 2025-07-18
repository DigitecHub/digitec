"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { FaPlay, FaArrowRight, FaLock, FaChevronUp } from 'react-icons/fa';
import '../../styles/Courses.css';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setUser(user);
        
        // Get all courses with pricing info
        const { data: coursesData, error: coursesError } = await supabase
          .rpc('get_courses_with_pricing');
          
        if (coursesError) throw coursesError;
        setCourses(coursesData);
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
  }, [supabase]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const formatPrice = (price, currency = 'NGN') => {
    if (price === null || price === undefined) return '';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="courses-loading">
        <div className="spinner"></div>
        <p>Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="courses-error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <Link href="/" className="back-to-home">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="courses-container">
      <div className="courses-header">
        <h1>Our Courses</h1>
        <p>Explore our wide range of courses designed to help you master digital skills</p>
      </div>
      
      <div className="courses-grid">
        {courses.map((course) => (
          <div key={course.id} className="course-card">
            <div className="course-image-container">
              <Image 
                src={course.image_url || '/images/course-placeholder.jpg'} 
                alt={course.title} 
                width={400} 
                height={225} 
                layout="responsive"
                className="course-image"
              />
              <div className="course-overlay">
                <Link href={`/courses/${course.id}`} className="view-course-btn">
                  <FaPlay /> View Course
                </Link>
              </div>
              <div className={`course-badge ${course.level}`}>{course.level}</div>
            </div>
            <div className="course-content">
              <h3>{course.title}</h3>
              <p className="course-description">{course.description}</p>
              <div className="course-meta">
                <span className="course-category">{course.category}</span>
                <span className="course-duration">{course.duration}</span>
              </div>
              <div className="course-actions">
                <div className="course-price">
                  {course.is_completely_free ? (
                    <span className="price-free">Free</span>
                  ) : (
                    <>
                      <span className="price-label">Starting from</span>
                      <span className="price-amount">{formatPrice(course.min_price, course.currency)}</span>
                    </>
                  )}
                </div>
                <Link href={`/courses/${course.id}`} className="course-enroll-btn">
                  {course.is_completely_free ? 'Enroll Now' : 'View Options'}
                  <FaArrowRight />
                </Link>
              </div>
            </div>
          </div>
        ))}
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
