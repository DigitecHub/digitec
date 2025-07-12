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
        
        // Get all courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .order('order_index', { ascending: true });
          
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
                <Link href={`/courses/${course.id}`} className="course-details-btn">
                  View Details <FaArrowRight />
                </Link>
                {user ? (
                  <Link href={`/enrollment/${course.id}`} className="course-enroll-btn">
                    Enroll Now
                  </Link>
                ) : (
                  <Link href={`/auth/signin?redirect=/enrollment/${course.id}`} className="course-enroll-btn locked">
                    <FaLock /> Sign in to Enroll
                  </Link>
                )}
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
