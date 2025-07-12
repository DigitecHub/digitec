"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { FaCheck, FaTimes, FaSpinner, FaArrowRight } from 'react-icons/fa';
import '../styles/LessonProgress.css';

const LessonProgress = ({ 
  lessonId, 
  subCourseId, 
  courseId, 
  nextLessonId = null,
  nextLessonTitle = null
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('not_started');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Sample quiz questions - in a real app, these would come from the database
  const sampleQuestions = [
    {
      id: 1,
      question: "What is the main purpose of this lesson?",
      options: [
        "To entertain the user",
        "To teach the core concepts of the subject",
        "To provide background information only",
        "None of the above"
      ],
      correctAnswer: 1 // Index of the correct answer (0-based)
    },
    {
      id: 2,
      question: "Which of the following best describes the content covered?",
      options: [
        "Advanced techniques only",
        "Theoretical concepts without practical applications",
        "Fundamental principles with practical examples",
        "Historical background of the subject"
      ],
      correctAnswer: 2
    },
    {
      id: 3,
      question: "What should you do after completing this lesson?",
      options: [
        "Immediately move to the next lesson without review",
        "Practice the concepts learned and review materials",
        "Skip the quiz section",
        "Ignore the practical examples"
      ],
      correctAnswer: 1
    }
  ];

  useEffect(() => {
    async function fetchProgress() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!user) {
          setError("You must be logged in to track progress");
          setLoading(false);
          return;
        }
        
        // Check if progress record exists
        const { data: progressData, error: progressError } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .single();
          
        if (progressError && progressError.code !== 'PGRST116') {
          throw progressError;
        }
        
        if (progressData) {
          setProgress(progressData.progress_percentage);
          setStatus(progressData.status);
          setQuizCompleted(progressData.progress_percentage === 100);
          setQuizPassed(progressData.progress_percentage >= 70);
        } else {
          // Create new progress record
          const { error: insertError } = await supabase
            .from('lesson_progress')
            .insert({
              user_id: user.id,
              lesson_id: lessonId,
              sub_course_id: subCourseId,
              course_id: courseId,
              progress_percentage: 0,
              status: 'not_started'
            });
            
          if (insertError) throw insertError;
        }

        // Load quiz questions (in a real app, fetch from database)
        setQuizQuestions(sampleQuestions);
        
      } catch (error) {
        console.error('Error fetching progress:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProgress();
  }, [lessonId, subCourseId, courseId, supabase]);

  const updateProgress = async (newProgress, newStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { error } = await supabase
        .from('lesson_progress')
        .update({
          progress_percentage: newProgress,
          status: newStatus,
          last_accessed: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId);
        
      if (error) throw error;
      
      setProgress(newProgress);
      setStatus(newStatus);
      
      // If progress is 100%, update the sub-course enrollment status
      if (newProgress === 100) {
        await updateSubCourseProgress();
      }
      
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const updateSubCourseProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // Get all lessons for this sub-course
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('sub_course_id', subCourseId);
        
      if (lessonsError) throw lessonsError;
      
      // Get progress for all lessons in this sub-course
      const { data: lessonsProgress, error: progressError } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('sub_course_id', subCourseId);
        
      if (progressError) throw progressError;
      
      // Check if all lessons are completed
      const allLessonsCompleted = lessons.length > 0 && 
        lessonsProgress.length === lessons.length &&
        lessonsProgress.every(progress => progress.status === 'completed');
      
      if (allLessonsCompleted) {
        // Update sub-course enrollment status
        const { error: updateError } = await supabase
          .from('sub_course_enrollments')
          .update({ status: 'completed' })
          .eq('user_id', user.id)
          .eq('sub_course_id', subCourseId);
          
        if (updateError) throw updateError;
      }
      
    } catch (error) {
      console.error('Error updating sub-course progress:', error);
    }
  };

  const startLesson = async () => {
    await updateProgress(10, 'in_progress');
  };

  const markAsInProgress = async () => {
    if (status === 'not_started') {
      await startLesson();
    }
  };

  const completeLesson = async () => {
    setShowQuiz(true);
    await updateProgress(50, 'in_progress');
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    
    try {
      // Calculate score
      let correctAnswers = 0;
      
      quizQuestions.forEach(question => {
        if (userAnswers[question.id] === question.correctAnswer) {
          correctAnswers++;
        }
      });
      
      const score = (correctAnswers / quizQuestions.length) * 100;
      setQuizScore(score);
      setQuizCompleted(true);
      
      // Check if passed (70% or higher)
      const passed = score >= 70;
      setQuizPassed(passed);
      
      // Update progress
      await updateProgress(
        passed ? 100 : 50,
        passed ? 'completed' : 'in_progress'
      );
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const retakeQuiz = () => {
    setQuizCompleted(false);
    setUserAnswers({});
  };

  const goToNextLesson = () => {
    if (nextLessonId) {
      router.push(`/courses/learn/${courseId}?lesson=${nextLessonId}`);
    }
  };

  if (loading) {
    return (
      <div className="lesson-progress-loading">
        <FaSpinner className="spinner" />
        <p>Loading progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lesson-progress-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="lesson-progress-container">
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="progress-percentage">{Math.round(progress)}% Complete</div>
      </div>
      
      {!showQuiz && status !== 'completed' && (
        <div className="lesson-actions">
          {status === 'not_started' ? (
            <button className="start-lesson-btn" onClick={startLesson}>
              Start Lesson
            </button>
          ) : (
            <button className="complete-lesson-btn" onClick={completeLesson}>
              Complete & Take Quiz
            </button>
          )}
        </div>
      )}
      
      {showQuiz && !quizCompleted && (
        <div className="lesson-quiz">
          <h3>Lesson Quiz</h3>
          <p className="quiz-instructions">
            Complete the quiz below to test your understanding. You need 70% to pass.
          </p>
          
          <div className="quiz-questions">
            {quizQuestions.map((question, qIndex) => (
              <div key={question.id} className="quiz-question">
                <h4>Question {qIndex + 1}: {question.question}</h4>
                <div className="quiz-options">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="quiz-option">
                      <input
                        type="radio"
                        id={`q${question.id}-o${oIndex}`}
                        name={`question-${question.id}`}
                        checked={userAnswers[question.id] === oIndex}
                        onChange={() => handleAnswerSelect(question.id, oIndex)}
                      />
                      <label htmlFor={`q${question.id}-o${oIndex}`}>{option}</label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="quiz-actions">
            <button 
              className="submit-quiz-btn"
              onClick={submitQuiz}
              disabled={submitting || Object.keys(userAnswers).length !== quizQuestions.length}
            >
              {submitting ? <FaSpinner className="spinner" /> : 'Submit Quiz'}
            </button>
          </div>
        </div>
      )}
      
      {quizCompleted && (
        <div className={`quiz-results ${quizPassed ? 'passed' : 'failed'}`}>
          <h3>{quizPassed ? 'Congratulations!' : 'Almost There!'}</h3>
          <div className="quiz-score">
            <div className="score-circle">
              {Math.round(quizScore)}%
            </div>
            <p className="score-text">
              {quizPassed 
                ? 'You passed the quiz and completed this lesson!' 
                : 'You need 70% to pass. Try again!'}
            </p>
          </div>
          
          <div className="quiz-actions">
            {quizPassed ? (
              nextLessonId ? (
                <button className="next-lesson-btn" onClick={goToNextLesson}>
                  Next Lesson: {nextLessonTitle} <FaArrowRight />
                </button>
              ) : (
                <div className="course-complete-message">
                  <FaCheck className="complete-icon" />
                  <p>You've completed all lessons in this module!</p>
                </div>
              )
            ) : (
              <button className="retake-quiz-btn" onClick={retakeQuiz}>
                Retake Quiz
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonProgress; 