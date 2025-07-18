"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaLock, FaCheck, FaPlay, FaBook, FaQuestionCircle, FaFile, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import '../../../../styles/CourseLearn.css';
import LessonProgress from '../../../../components/LessonProgress';
import SuccessModal from '../../../../components/SuccessModal';
import PaymentEnrollment from '../../../../components/PaymentEnrollment';

export default function CourseLearnPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [subCourses, setSubCourses] = useState([]);
  const [enrolledSubCourses, setEnrolledSubCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSubCourse, setActiveSubCourse] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [testQuestions, setTestQuestions] = useState([]);
  const [showTestQuestions, setShowTestQuestions] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [isEnrolling, setIsEnrolling] = useState(null); // Track which sub-course is being enrolled
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
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
          router.push(`/auth/signin?redirect=/courses/learn/${courseId}`);
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
        
        // Check if user is enrolled
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId);
          
        if (enrollmentError) throw enrollmentError;
        
        if (!enrollmentData || enrollmentData.length === 0) {
          // User not enrolled, redirect to enrollment page
          router.push(`/enrollment/${courseId}`);
          return;
        }
        
        // Get enrolled sub-courses
        const { data: subEnrollmentData, error: subEnrollmentError } = await supabase
          .from('sub_course_enrollments')
          .select('sub_course_id, status')
          .eq('user_id', user.id)
          .eq('course_id', courseId);
          
        if (subEnrollmentError) throw subEnrollmentError;
        
        setEnrolledSubCourses(subEnrollmentData.map(item => item.sub_course_id));
        
        // Get all sub-courses with pricing info
        const { data: subCoursesData, error: subCoursesError } = await supabase
          .from('sub_courses')
          .select('*, lessons(id))') // Also fetch lessons count
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });
          
        if (subCoursesError) throw subCoursesError;
        setSubCourses(subCoursesData);
        
        // Calculate Overall Course Progress
        const subCourseIds = subCoursesData.map(sc => sc.id);
        const { data: allLessons, error: allLessonsError } = await supabase
          .from('lessons')
          .select('id')
          .in('sub_course_id', subCourseIds);

        if (allLessonsError) throw allLessonsError;

        const { data: completedProgress, error: progressError } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .eq('status', 'completed');
        
        if (progressError) throw progressError;

        const totalLessonsCount = allLessons.length;
        const completedLessonsCount = completedProgress ? completedProgress.length : 0;
        const calculatedProgress = totalLessonsCount > 0 
          ? Math.floor((completedLessonsCount / totalLessonsCount) * 100) 
          : 0;
        setProgress(calculatedProgress);

        // Set active sub-course to the first one, and fetch its lessons
        if (subCoursesData && subCoursesData.length > 0) {
          const firstEnrolledSubCourse = subCoursesData.find(sc => enrolledSubCourses.includes(sc.id)) || subCoursesData[0];
          setActiveSubCourse(firstEnrolledSubCourse);

          const { data: lessonsData, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('sub_course_id', firstEnrolledSubCourse.id)
            .order('order_index', { ascending: true });

          if (lessonsError) throw lessonsError;
          setLessons(lessonsData);

          if (lessonsData && lessonsData.length > 0) {
            setActiveLessonId(lessonsData[0].id);
            setActiveLesson(lessonsData[0]);
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
  }, [courseId, router, supabase]);

  useEffect(() => {
    // Update active lesson when activeLessonId changes
    if (activeLessonId) {
      const lesson = lessons.find(l => l.id === activeLessonId);
      setActiveLesson(lesson);
      
      // Reset states for the new lesson
      setShowTestQuestions(false);
      setTestSubmitted(false);
      setUserAnswers({});
      setTestScore(0);
      setActiveTab('content');
      setShowTranscript(false);
      setTranscript(null);
      setTestQuestions([]); // Clear previous questions
    }
  }, [activeLessonId, lessons]);

  useEffect(() => {
    // Fetch data when active lesson changes
    if (activeLessonId) {
      fetchTestQuestions(activeLessonId);
      fetchTranscript(activeLessonId);
    }
  }, [activeLessonId]);

  const fetchTestQuestions = async (lessonId) => {
    try {
      const { data, error } = await supabase
        .from('test_questions')
        .select('*')
        .eq('lesson_id', lessonId);

      if (error) throw error;
      setTestQuestions(data || []);
    } catch (error) {
      console.error('Error fetching test questions:', error);
    }
  };

  const fetchTranscript = async (lessonId) => {
    try {
      const { data, error } = await supabase
        .from('video_transcripts')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setTranscript(data || null);
    } catch (error) {
      console.error('Error fetching transcript:', error);
    }
  };

  const handleSubCourseChange = async (subCourse) => {
    setActiveSubCourse(subCourse);
    
    try {
      // Get lessons for the selected sub-course
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('sub_course_id', subCourse.id)
        .order('order_index', { ascending: true });
        
      if (lessonsError) throw lessonsError;
      setLessons(lessonsData);
      
      if (lessonsData && lessonsData.length > 0) {
        setActiveLessonId(lessonsData[0].id);
        setActiveLesson(lessonsData[0]);
      } else {
        setActiveLessonId(null);
        setActiveLesson(null);
        setLessons([]);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setLessons([]);
    }
  };

  // Track lesson progress
  const calculateAndUpdateProgress = async () => {
    if (!user || !courseId || subCourses.length === 0) return;

    try {
      const subCourseIds = subCourses.map(sc => sc.id);
      const { data: allLessons, error: allLessonsError } = await supabase
        .from('lessons')
        .select('id')
        .in('sub_course_id', subCourseIds);

      if (allLessonsError) throw allLessonsError;

      const { data: completedProgress, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('status', 'completed');
      
      if (progressError) throw progressError;

      const totalLessonsCount = allLessons.length;
      const completedLessonsCount = completedProgress ? completedProgress.length : 0;
      const newProgress = totalLessonsCount > 0 
        ? Math.floor((completedLessonsCount / totalLessonsCount) * 100) 
        : 0;
      
      setProgress(newProgress);
    } catch (error) {
      console.error('Error calculating progress:', error);
    }
  };

  const updateLessonProgress = async (lessonId, progress = 0) => {
    if (!user || !lessonId) return;

    try {
      // Check if a record already exists
      const { data: existingProgress, error: fetchError } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine. Throw other errors.
        throw fetchError;
      }

      const progressData = {
        user_id: user.id,
        lesson_id: lessonId,
        sub_course_id: activeSubCourse?.id,
        course_id: courseId,
        progress_percentage: progress,
        status: progress >= 100 ? 'completed' : 'in_progress',
        last_accessed: new Date().toISOString(),
      };

      if (existingProgress) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('lesson_progress')
          .update(progressData)
          .eq('id', existingProgress.id);
        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('lesson_progress')
          .insert(progressData);
        if (insertError) throw insertError;
      }

      // After updating or inserting, recalculate the overall progress
      if (progress >= 100) {
        await calculateAndUpdateProgress();
      }

    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitTest = () => {
    // Calculate score
    let correctAnswers = 0;
    
    testQuestions.forEach(question => {
      if (userAnswers[question.id] === question.correct_answer) {
        correctAnswers++;
      }
    });
    
    const scorePercentage = Math.floor((correctAnswers / testQuestions.length) * 100);
    setTestScore(scorePercentage);
    setTestSubmitted(true);
    
    // If user scored 70% or more, mark lesson as completed
    if (scorePercentage >= 70) {
      updateLessonProgress(activeLessonId, 100);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'test') {
      setShowTestQuestions(true);
      setShowTranscript(false);
    } else if (tab === 'transcript') {
      setShowTranscript(true);
      setShowTestQuestions(false);
    } else {
      setShowTestQuestions(false);
      setShowTranscript(false);
    }
  };

  const handleEnrollmentSuccess = (subCourseId) => {
    setEnrolledSubCourses(prev => [...prev, subCourseId]);
    // The activeSubCourse is already set, so the view will update automatically
    // to show the lesson content instead of the payment form.
    setModalContent({
      title: 'Enrollment Successful!',
      message: 'You can now access all the lessons in this module.',
    });
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="course-learn-loading">
        <div className="spinner"></div>
        <p>Loading course content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-learn-error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <Link href="/dashboard" className="back-to-dashboard">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <SuccessModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalContent.title}
        message={modalContent.message}
      />
      <div className="course-learn-container">
        <div className="course-learn-header">
          <Link href="/dashboard" className="back-link">
            <FaArrowLeft /> Back to Dashboard
          </Link>
          <h1>{course?.title}</h1>
          <p>{course?.description}</p>
        </div>
        
        <div className="course-learn-content">
          <div className="course-sidebar">
            <div className="course-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-text">{progress}% Complete</div>
            </div>
            
            <h3>Course Modules</h3>
            <div className="sub-courses-list">
              {subCourses.map((subCourse) => {
                const isActive = activeSubCourse?.id === subCourse.id;
                return (
                  <div 
                    key={subCourse.id} 
                    className={`sub-course-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSubCourseChange(subCourse)}
                  >
                    <div className="sub-course-nav-info">
                      <h4>{subCourse.title}</h4>
                      <span>{subCourse.lessons.length} lessons</span>
                    </div>
                    <div className="sub-course-status">
                      {enrolledSubCourses.includes(subCourse.id) ? (
                        <div className="status-enrolled">
                          <FaCheck />
                        </div>
                      ) : (
                        <div className="status-locked">
                          <FaLock />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
      
          <div className="course-main-content">
            {activeSubCourse ? (
              enrolledSubCourses.includes(activeSubCourse.id) ? (
                // USER IS ENROLLED - SHOW LESSON CONTENT
                <div className="active-sub-course">
                  <div className="sub-course-header">
                    <h2>{activeSubCourse.title}</h2>
                    <p>{activeSubCourse.description}</p>
                  </div>
                  
                  {lessons.length > 0 ? (
                    <div className="lessons-container">
                      <div className="lessons-list">
                        <h3>Lessons</h3>
                        {lessons.map((lesson) => (
                          <div 
                            key={lesson.id} 
                            className={`lesson-item ${activeLessonId === lesson.id ? 'active' : ''}`}
                            onClick={() => setActiveLessonId(lesson.id)}
                          >
                            <div className="lesson-icon">
                              {lesson.lesson_type === 'video' ? <FaPlay /> : <FaBook />}
                            </div>
                            <div className="lesson-info">
                              <h4>{lesson.title}</h4>
                              <span>{lesson.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {activeLesson ? (
                        <div className="active-lesson">
                          <h3>{activeLesson.title}</h3>
                          
                          <div className="lesson-tabs">
                            <button 
                              className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
                              onClick={() => handleTabChange('content')}
                            >
                              <FaBook /> Lesson Content
                            </button>
                            
                            {testQuestions.length > 0 && (
                              <button 
                                className={`tab-btn ${activeTab === 'test' ? 'active' : ''}`}
                                onClick={() => handleTabChange('test')}
                              >
                                <FaQuestionCircle /> Practice Test
                              </button>
                            )}
                            
                            {transcript && (
                              <button 
                                className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
                                onClick={() => handleTabChange('transcript')}
                              >
                                <FaFile /> Transcript
                              </button>
                            )}
                          </div>
                          
                          {activeTab === 'content' && (
                            <>
                              <div className="lesson-video-container">
                                {activeLesson.video_url ? (
                                  <div className="video-responsive">
                                    <iframe
                                      width="853"
                                      height="480"
                                      src={activeLesson.video_url}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      title={activeLesson.title}
                                      onLoad={() => updateLessonProgress(activeLesson.id, 10)}
                                    />
                                  </div>
                                ) : (
                                  <div className="lesson-video-placeholder">
                                    <FaPlay className="play-icon" />
                                    <p>No video available for this lesson</p>
                                  </div>
                                )}
                              </div>
                              <div className="lesson-text-content">
                                <div dangerouslySetInnerHTML={{ __html: activeLesson.content || 'No content available.' }} />
                              </div>
                              <LessonProgress 
                                lessonId={activeLesson.id}
                                subCourseId={activeSubCourse.id}
                                courseId={courseId}
                                nextLessonId={lessons[lessons.findIndex(l => l.id === activeLesson.id) + 1]?.id}
                                nextLessonTitle={lessons[lessons.findIndex(l => l.id === activeLesson.id) + 1]?.title}
                              />
                            </>
                          )}
                          
                          {activeTab === 'test' && showTestQuestions && (
                             <div className="test-questions-container">{/* Test content here */}</div>
                          )}
                          
                          {activeTab === 'transcript' && showTranscript && transcript && (
                            <div className="transcript-container">{/* Transcript content here */}</div>
                          )}
                        </div>
                      ) : (
                        <div className="no-lesson-selected">
                          <p>Select a lesson to begin learning.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-lessons">
                      <p>No lessons available for this module yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                // USER IS NOT ENROLLED - SHOW PAYMENT/ENROLLMENT FORM
                <div className="payment-enrollment-container">
                  <PaymentEnrollment 
                    subCourse={activeSubCourse}
                    course={course}
                    user={user}
                    onEnrollmentSuccess={() => handleEnrollmentSuccess(activeSubCourse.id)}
                  />
                </div>
              )
            ) : (
              // NO SUB-COURSE SELECTED
              <div className="no-sub-course-selected">
                <p>Select a module from the sidebar to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}