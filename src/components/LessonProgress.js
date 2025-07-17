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

  useEffect(() => {
    async function fetchLessonData() {
      if (!lessonId) return;
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("You must be logged in to track progress");
          setLoading(false);
          return;
        }

        // Fetch lesson progress
        const { data: progressData, error: progressError } = await supabase
          .from('lesson_progress')
          .select('status, progress_percentage')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .single();

        if (progressError && progressError.code !== 'PGRST116') throw progressError;

        if (progressData) {
          setStatus(progressData.status);
          setProgress(progressData.progress_percentage);
          if (progressData.status === 'completed') {
            setQuizCompleted(true);
            setQuizPassed(true);
            setQuizScore(progressData.progress_percentage);
          }
        }

        // Fetch sample questions for the quiz
        const { data: questionsData, error: questionsError } = await supabase
          .from('sample_questions')
          .select('id, question_text, options, correct_answer')
          .eq('lesson_id', lessonId);

        if (questionsError) throw questionsError;
        setQuizQuestions(questionsData || []);

      } catch (err) {
        setError(err.message);
        console.error('Error fetching lesson data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLessonData();
  }, [lessonId, supabase]);

  const updateProgress = async (newProgress, newStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
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

      if (newStatus === 'completed') {
        // Optionally trigger a parent component update
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update progress.');
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    
    let correctAnswers = 0;
    quizQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correct_answer) {
        correctAnswers++;
      }
    });
    
    const score = quizQuestions.length > 0 ? (correctAnswers / quizQuestions.length) * 100 : 0;
    setQuizScore(score);
    setQuizCompleted(true);
    
    const passed = score >= 70;
    setQuizPassed(passed);
    
    await updateProgress(
      score,
      passed ? 'completed' : 'in_progress'
    );
    
    setSubmitting(false);
  };

  const retakeQuiz = () => {
    setQuizCompleted(false);
    setUserAnswers({});
    setQuizScore(0);
    setQuizPassed(false);
    setShowQuiz(true);
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
        <p>Loading Lesson...</p>
      </div>
    );
  }

  if (error) {
    return <div className="lesson-progress-error"><p>{error}</p></div>;
  }

  return (
    <div className="lesson-progress-container">
      {status !== 'completed' && !showQuiz && (
        <button className="complete-lesson-btn" onClick={() => setShowQuiz(true)}>
          Take Quiz to Complete Lesson
        </button>
      )}

      {showQuiz && !quizCompleted && (
        <div className="lesson-quiz">
          <h3>Lesson Quiz</h3>
          {quizQuestions.length > 0 ? (
            <div className="quiz-questions">
              {quizQuestions.map((q, qIndex) => (
                <div key={q.id} className="quiz-question">
                  <h4>Question {qIndex + 1}: {q.question_text}</h4>
                  <div className="quiz-options">
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className="quiz-option">
                        <input
                          type="radio"
                          id={`q${q.id}-o${oIndex}`}
                          name={`question-${q.id}`}
                          value={option}
                          checked={userAnswers[q.id] === option}
                          onChange={() => handleAnswerSelect(q.id, option)}
                        />
                        <label htmlFor={`q${q.id}-o${oIndex}`}>{option}</label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No quiz questions available for this lesson.</p>
          )}
          
          {quizQuestions.length > 0 && (
            <div className="quiz-actions">
              <button 
                className="submit-quiz-btn"
                onClick={submitQuiz}
                disabled={submitting || Object.keys(userAnswers).length !== quizQuestions.length}
              >
                {submitting ? <FaSpinner className="spinner" /> : 'Submit Quiz'}
              </button>
            </div>
          )}
        </div>
      )}
      
      {status === 'completed' && quizCompleted && (
        <div className={`quiz-results ${quizPassed ? 'passed' : 'failed'}`}>
          <h3>{quizPassed ? 'Congratulations!' : 'Almost There!'}</h3>
          <div className="quiz-score">
            <div className="score-circle">
              {Math.round(quizScore)}%
            </div>
            <p className="score-text">
              {quizPassed 
                ? 'You passed the quiz and completed this lesson!' 
                : 'You need 70% to pass. Please try again.'}
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