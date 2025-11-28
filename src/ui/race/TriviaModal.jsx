import { useState, useEffect, useCallback } from 'react';
import './triviaModal.css';

const TriviaModal = ({ question, onAnswer, timeLimit }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeLeft(remaining);
      
      if (remaining === 0 && !answered) {
        handleTimeout();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [question.id, timeLimit]);

  const handleTimeout = useCallback(() => {
    if (!answered) {
      setAnswered(true);
      onAnswer(-1); // Timeout
    }
  }, [answered, onAnswer]);

  const handleSelect = useCallback((index) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);
    
    setTimeout(() => {
      onAnswer(index);
    }, 500);
  }, [answered, onAnswer]);

  const timePercent = (timeLeft / timeLimit) * 100;
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="trivia-modal-overlay">
      <div className="trivia-modal">
        {/* Timer */}
        <div className="trivia-timer">
          <div 
            className="timer-bar" 
            style={{ 
              width: `${timePercent}%`,
              backgroundColor: timePercent > 30 ? '#4ECDC4' : '#FF6B6B'
            }} 
          />
        </div>
        
        {/* Category */}
        {question.category && (
          <span className="trivia-category">{question.category}</span>
        )}
        
        {/* Question */}
        <h2 className="trivia-question">{question.question}</h2>
        
        {/* Options */}
        <div className="trivia-options">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`trivia-option ${
                selectedAnswer === index 
                  ? (isCorrect ? 'correct' : 'wrong')
                  : ''
              } ${answered && index === question.correctAnswer ? 'correct' : ''}`}
              onClick={() => handleSelect(index)}
              disabled={answered}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>
        
        {/* Result feedback */}
        {answered && (
          <div className={`trivia-result ${isCorrect ? 'correct' : 'wrong'}`}>
            {isCorrect ? '✓ Correct! Speed boost!' : '✗ Wrong! Slowing down...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TriviaModal;
