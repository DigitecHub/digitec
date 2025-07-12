"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaLock, FaCheck, FaPlay, FaBook, FaQuestionCircle, FaFile, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import '../../../../styles/CourseLearn.css';
import LessonProgress from '../../../../components/LessonProgress';

export default function CourseLearnPage({ params }) {
  const { courseId } = params;
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
        
        // Get all sub-courses
        const { data: subCoursesData, error: subCoursesError } = await supabase
          .from('sub_courses')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });
          
        if (subCoursesError) throw subCoursesError;
        setSubCourses(subCoursesData);
        
        // Set active sub-course to first enrolled sub-course
        if (subCoursesData && subCoursesData.length > 0) {
          const enrolledSubCourseIds = subEnrollmentData.map(item => item.sub_course_id);
          const firstEnrolledSubCourse = subCoursesData.find(sc => enrolledSubCourseIds.includes(sc.id));
          
          if (firstEnrolledSubCourse) {
            setActiveSubCourse(firstEnrolledSubCourse);
            
            // Get lessons for the active sub-course
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

              // Get progress for enrolled lessons
              const { data: progressData, error: progressError } = await supabase
                .from('lesson_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('course_id', courseId);

              if (!progressError && progressData) {
                // Calculate overall progress
                const completedLessons = progressData.filter(p => p.status === 'completed').length;
                const totalLessons = lessonsData.length;
                const calculatedProgress = totalLessons > 0 ? Math.floor((completedLessons / totalLessons) * 100) : 0;
                setProgress(calculatedProgress);
              }
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
  }, [courseId, router, supabase]);

  useEffect(() => {
    // Update active lesson when activeLessonId changes
    if (activeLessonId) {
      const lesson = lessons.find(l => l.id === activeLessonId);
      setActiveLesson(lesson);
      
      // Reset test related states
      setShowTestQuestions(false);
      setTestSubmitted(false);
      setUserAnswers({});
      setTestScore(0);
      setActiveTab('content');
      setShowTranscript(false);
      setTranscript(null);

      // Fetch test questions for this lesson
      fetchTestQuestions(activeLessonId);
      
      // Fetch transcript for this lesson
      fetchTranscript(activeLessonId);
    }
  }, [activeLessonId, lessons]);

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
    if (!enrolledSubCourses.includes(subCourse.id)) {
      return; // User not enrolled in this sub-course
    }
    
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
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  // Track lesson progress
  const updateLessonProgress = async (lessonId, progress = 0) => {
    if (!user || !lessonId) return;
    
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          sub_course_id: activeSubCourse?.id,
          course_id: courseId,
          progress_percentage: progress,
          status: progress >= 100 ? 'completed' : 'in_progress',
          last_accessed: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        });
      
      if (error) throw error;
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
              const isEnrolled = enrolledSubCourses.includes(subCourse.id);
              const isActive = activeSubCourse?.id === subCourse.id;
              
              return (
                <div 
                  key={subCourse.id} 
                  className={`sub-course-nav-item ${isActive ? 'active' : ''} ${isEnrolled ? 'enrolled' : 'locked'}`}
                  onClick={() => isEnrolled && handleSubCourseChange(subCourse)}
                >
                  <div className="sub-course-nav-icon">
                    {isEnrolled ? (
                      isActive ? <FaCheck /> : <FaPlay />
                    ) : (
                      <FaLock />
                    )}
                  </div>
                  <div className="sub-course-nav-info">
                    <h4>{subCourse.title}</h4>
                    <span>{subCourse.duration}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="course-main-content">
          {activeSubCourse ? (
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
                          {activeLessonId === lesson.id ? <FaPlay /> : <FaCheck />}
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
                            <div dangerouslySetInnerHTML={{ __html: activeLesson.content || 'No content available for this lesson.' }} />
                          </div>
                          
                          {/* Add the LessonProgress component */}
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
                          <h4 className="test-title">Practice Test: {activeLesson.title}</h4>
                          
                          {testSubmitted ? (
                            <div className="test-results">
                              <div className={`test-score ${testScore >= 70 ? 'pass' : 'fail'}`}>
                                <h5>Your Score: {testScore}%</h5>
                                <div className="score-bar">
                                  <div className="score-fill" style={{ width: `${testScore}%` }}></div>
                                </div>
                                {testScore >= 70 ? (
                                  <p className="pass-message">
                                    <FaCheck /> Great job! You passed the test.
                                  </p>
                                ) : (
                                  <p className="fail-message">
                                    Keep learning and try again.
                                  </p>
                                )}
                              </div>
                              
                              <button 
                                className="retry-btn" 
                                onClick={() => {
                                  setTestSubmitted(false);
                                  setUserAnswers({});
                                }}
                              >
                                Try Again
                              </button>
                              
                              <div className="test-review">
                                <h5>Review Questions</h5>
                                {testQuestions.map((question, index) => (
                                  <div 
                                    key={question.id} 
                                    className={`test-question ${
                                      userAnswers[question.id] === question.correct_answer ? 'correct' : 'incorrect'
                                    }`}
                                  >
                                    <p className="question-text">{index + 1}. {question.question_text}</p>
                                    <div className="question-options review">
                                      {question.options.map((option, optIndex) => (
                                        <div 
                                          key={optIndex} 
                                          className={`option ${
                                            option === question.correct_answer ? 'correct' : 
                                            userAnswers[question.id] === option ? 'selected' : ''
                                          }`}
                                        >
                                          {option}
                                          {option === question.correct_answer && <FaCheck className="correct-icon" />}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="test-instructions">
                                Answer all questions and submit to test your knowledge. You need 70% to pass.
                              </p>
                              
                              <div className="test-questions">
                                {testQuestions.map((question, index) => (
                                  <div key={question.id} className="test-question animated fadeInUp" style={{ animationDelay: `${index * 0.15}s` }}>
                                    <p className="question-text">{index + 1}. {question.question_text}</p>
                                    <div className="question-options">
                                      {question.options.map((option, optIndex) => (
                                        <div 
                                          key={optIndex} 
                                          className={`option ${userAnswers[question.id] === option ? 'selected' : ''}`}
                                          onClick={() => handleAnswerSelect(question.id, option)}
                                        >
                                          {option}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <button 
                                className="submit-test-btn" 
                                onClick={handleSubmitTest}
                                disabled={Object.keys(userAnswers).length !== testQuestions.length}
                              >
                                Submit Answers
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'transcript' && showTranscript && transcript && (
                        <div className="transcript-container animated fadeIn">
                          <h4 className="transcript-title">Video Transcript</h4>
                          <div className="transcript-content">
                            {transcript.transcript_text.split('\n\n').map((paragraph, index) => (
                              <p key={index} className="transcript-paragraph animated fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-lesson-selected">
                      <p>Select a lesson to begin learning</p>
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
            <div className="no-sub-course-selected">
              <p>Select a module to begin learning</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 