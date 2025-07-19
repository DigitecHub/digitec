"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaLock, FaCheck, FaPlay, FaBook, FaQuestionCircle, FaFile, FaChevronRight, FaChevronDown, FaSpinner } from 'react-icons/fa';
import '../../../../styles/CourseLearn.css';
import LessonProgress from '../../../../components/LessonProgress';
import SuccessModal from '../../../../components/SuccessModal';
import PaystackIntegration from '../../../../components/PaystackIntegration';

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
  const [showPayment, setShowPayment] = useState(false);
  const [selectedSubCourses, setSelectedSubCourses] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
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
    const calculateTotal = () => {
      const total = selectedSubCourses.reduce((acc, subCourseId) => {
        const subCourse = subCourses.find(sc => sc.id === subCourseId);
        return acc + (subCourse?.price || 0);
      }, 0);
      setTotalPrice(total);
    };
    if (subCourses.length > 0) calculateTotal();
  }, [selectedSubCourses, subCourses]);

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

  const handleRetakeTest = () => {
    setTestSubmitted(false);
    setUserAnswers({});
    setTestScore(0);
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

  const handlePaymentSuccess = (reference, paymentData) => {
    console.log('Payment successful on learn page:', reference, paymentData);
    setEnrolledSubCourses(prev => [...new Set([...prev, ...selectedSubCourses])]);
    setSelectedSubCourses([]);
    setShowPayment(false);
    setModalContent({
      title: 'Enrollment Successful!',
      message: 'You can now access all the lessons in the selected modules.',
    });
    setModalOpen(true);
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
      setModalContent({
        title: 'Enrollment Successful!',
        message: 'Your new modules are now available.',
      });
      setModalOpen(true);
    } catch (err) {
      console.error('Error during free enrollment:', err);
      setError(err.message);
    } finally {
      setEnrolling(false);
    }
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
                             <div className="test-questions-container">
                            {!testSubmitted ? (
                              <>
                                <h4>Practice Test</h4>
                                {testQuestions.map((q, index) => (
                                  <div key={q.id} className="question-block">
                                    <p><strong>Question {index + 1}:</strong> {q.question_text}</p>
                                    <div className="options-group">
                                      {q.options.map((option, i) => (
                                        <label key={i} className="option-label">
                                          <input
                                            type="radio"
                                            name={`question-${q.id}`}
                                            value={option}
                                            checked={userAnswers[q.id] === option}
                                            onChange={() => handleAnswerSelect(q.id, option)}
                                          />
                                          <span className="custom-radio"></span>
                                          <span className="option-text">{option}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                <button onClick={handleSubmitTest} className="submit-test-btn">Submit Test</button>
                              </>
                            ) : (
                              <div className="test-results">
                                <h4>Test Results</h4>
                                <p>Your Score: <strong>{testScore}%</strong></p>
                                {testScore < 70 && <p>You need at least 70% to pass.</p>}
                                {testQuestions.map((q, index) => (
                                  <div key={q.id} className="question-result">
                                    <p><strong>Question {index + 1}:</strong> {q.question_text}</p>
                                    <p className={userAnswers[q.id] === q.correct_answer ? 'correct' : 'incorrect'}>
                                      Your answer: {userAnswers[q.id]}
                                    </p>
                                    {userAnswers[q.id] !== q.correct_answer && (
                                      <p className="correct-answer">Correct answer: {q.correct_answer}</p>
                                    )}
                                  </div>
                                ))}
                                <button onClick={handleRetakeTest} className="retake-test-btn">Retake Test</button>
                              </div>
                            )}
                          </div>
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
                // USER IS NOT ENROLLED - SHOW ENROLLMENT SELECTION
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