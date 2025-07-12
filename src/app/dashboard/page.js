"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { FaBook, FaChartLine, FaCertificate, FaArrowRight, FaCalendarAlt } from 'react-icons/fa';
import '../../styles/Dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchUserAndCourses() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (user) {
          setUser(user);
          
          // Get user's enrolled courses with course details
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select(`
              id,
              user_id,
              course_id,
              status,
              enrollment_date,
              courses:course_id(id, title, description, image_url, category, level, duration)
            `)
            .eq('user_id', user.id);
            
          if (enrollmentsError) throw enrollmentsError;
          
          // Get sub-course enrollments for each course
          if (enrollments && enrollments.length > 0) {
            const enrollmentsWithSubCourses = await Promise.all(
              enrollments.map(async (enrollment) => {
                const { data: subEnrollments, error: subEnrollmentsError } = await supabase
                  .from('sub_course_enrollments')
                  .select(`
                    sub_course_id,
                    status,
                    sub_courses:sub_course_id(id, title, description, duration)
                  `)
                  .eq('user_id', user.id)
                  .eq('course_id', enrollment.course_id);
                
                if (subEnrollmentsError) throw subEnrollmentsError;
                
                return {
                  ...enrollment,
                  sub_enrollments: subEnrollments || []
                };
              })
            );
            
            setEnrolledCourses(enrollmentsWithSubCourses);
          } else {
            setEnrolledCourses([]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserAndCourses();
  }, [supabase]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <Link href="/" className="error-home-link">Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}</h1>
          <p>Track your progress and continue learning</p>
        </div>
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">
              <FaBook />
            </div>
            <div className="stat-info">
              <span className="stat-value">{enrolledCourses.length}</span>
              <span className="stat-label">Enrolled Courses</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FaChartLine />
            </div>
            <div className="stat-info">
              <span className="stat-value">0%</span>
              <span className="stat-label">Average Progress</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FaCertificate />
            </div>
            <div className="stat-info">
              <span className="stat-value">0</span>
              <span className="stat-label">Certificates</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <section className="enrolled-courses">
          <div className="section-header">
            <h2>My Courses</h2>
            <Link href="/courses" className="view-all-link">
              Browse More Courses <FaArrowRight />
            </Link>
          </div>
          
          {enrolledCourses.length === 0 ? (
            <div className="no-courses">
              <div className="no-courses-icon">📚</div>
              <h3>No courses enrolled yet</h3>
              <p>Explore our courses and start your learning journey today</p>
              <Link href="/courses" className="browse-courses-btn">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="courses-grid">
              {enrolledCourses.map((enrollment) => (
                <div key={enrollment.id} className="course-card">
                  <div className="course-image">
                    <Image 
                      src={enrollment.courses?.image_url || '/course-placeholder.jpg'} 
                      alt={enrollment.courses?.title} 
                      width={300} 
                      height={180} 
                      layout="responsive"
                    />
                    <div className="course-badge">{enrollment.courses?.level}</div>
                  </div>
                  <div className="course-content">
                    <h3>{enrollment.courses?.title}</h3>
                    <p className="course-description">{enrollment.courses?.description}</p>
                    <div className="course-meta">
                      <span className="course-category">{enrollment.courses?.category}</span>
                      <span className="course-duration">
                        <FaCalendarAlt /> {enrollment.courses?.duration}
                      </span>
                    </div>
                    <div className="progress-container">
                      <div className="progress-label">
                        <span>Progress</span>
                        <span>0%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                    <Link 
                      href={`/courses/learn/${enrollment.course_id}`}
                      className="continue-btn"
                    >
                      Continue Learning
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
} 