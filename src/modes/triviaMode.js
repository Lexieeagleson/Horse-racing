// Trivia Mode - Questions appear for all players, correct answers give speed boosts

// Sample trivia questions (can be expanded)
export const triviaQuestions = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    category: "Science"
  },
  {
    id: 3,
    question: "What year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2,
    category: "History"
  },
  {
    id: 4,
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Da Vinci", "Picasso", "Rembrandt"],
    correctAnswer: 1,
    category: "Art"
  },
  {
    id: 5,
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctAnswer: 3,
    category: "Geography"
  },
  {
    id: 6,
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correctAnswer: 2,
    category: "Geography"
  },
  {
    id: 7,
    question: "What is H2O commonly known as?",
    options: ["Salt", "Sugar", "Water", "Air"],
    correctAnswer: 2,
    category: "Science"
  },
  {
    id: 8,
    question: "Which animal is known as the King of the Jungle?",
    options: ["Tiger", "Lion", "Elephant", "Bear"],
    correctAnswer: 1,
    category: "Animals"
  },
  {
    id: 9,
    question: "What is the smallest country in the world?",
    options: ["Monaco", "Vatican City", "Malta", "San Marino"],
    correctAnswer: 1,
    category: "Geography"
  },
  {
    id: 10,
    question: "How many legs does a spider have?",
    options: ["6", "8", "10", "12"],
    correctAnswer: 1,
    category: "Animals"
  },
  {
    id: 11,
    question: "What color is a ruby?",
    options: ["Blue", "Green", "Red", "Yellow"],
    correctAnswer: 2,
    category: "General"
  },
  {
    id: 12,
    question: "Which sport uses a shuttlecock?",
    options: ["Tennis", "Badminton", "Squash", "Table Tennis"],
    correctAnswer: 1,
    category: "Sports"
  }
];

export const TRIVIA_CONFIG = {
  questionInterval: 8000, // ms between questions
  answerTimeout: 6000, // ms to answer
  boostDuration: 3000, // ms boost lasts
  slowdownDuration: 2000, // ms slowdown lasts
  boostMultiplier: 2.5,
  slowdownMultiplier: 0.3
};

// Get a random question that hasn't been asked recently
export const getRandomQuestion = (usedQuestionIds = []) => {
  const availableQuestions = triviaQuestions.filter(q => !usedQuestionIds.includes(q.id));
  if (availableQuestions.length === 0) {
    // Reset if all questions used
    return triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
  }
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
};

// Check if answer is correct
export const checkAnswer = (questionId, answerIndex) => {
  const question = triviaQuestions.find(q => q.id === questionId);
  if (!question) return false;
  return question.correctAnswer === answerIndex;
};

// Trivia Mode Controller
export class TriviaMode {
  constructor(onQuestion, onResult) {
    this.onQuestion = onQuestion;
    this.onResult = onResult;
    this.usedQuestionIds = [];
    this.currentQuestion = null;
    this.questionTimeout = null;
    this.intervalId = null;
    this.isActive = false;
    this.playerAnswers = {};
  }

  start() {
    this.isActive = true;
    this.usedQuestionIds = [];
    this.askQuestion();
    
    // Set up interval for new questions
    this.intervalId = setInterval(() => {
      if (this.isActive) {
        this.askQuestion();
      }
    }, TRIVIA_CONFIG.questionInterval);
  }

  stop() {
    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.questionTimeout) {
      clearTimeout(this.questionTimeout);
      this.questionTimeout = null;
    }
  }

  askQuestion() {
    this.currentQuestion = getRandomQuestion(this.usedQuestionIds);
    this.usedQuestionIds.push(this.currentQuestion.id);
    this.playerAnswers = {};
    
    if (this.onQuestion) {
      this.onQuestion({
        ...this.currentQuestion,
        startTime: Date.now(),
        timeout: TRIVIA_CONFIG.answerTimeout
      });
    }

    // Auto-resolve after timeout
    this.questionTimeout = setTimeout(() => {
      this.resolveQuestion();
    }, TRIVIA_CONFIG.answerTimeout);
  }

  submitAnswer(playerId, answerIndex) {
    if (!this.currentQuestion || this.playerAnswers[playerId] !== undefined) {
      return null;
    }

    const isCorrect = checkAnswer(this.currentQuestion.id, answerIndex);
    this.playerAnswers[playerId] = { answerIndex, isCorrect };

    const result = {
      playerId,
      isCorrect,
      modifier: isCorrect 
        ? { boost: true, duration: TRIVIA_CONFIG.boostDuration }
        : { slowdown: true, duration: TRIVIA_CONFIG.slowdownDuration }
    };

    if (this.onResult) {
      this.onResult(result);
    }

    return result;
  }

  resolveQuestion() {
    // Clear current question
    this.currentQuestion = null;
  }

  getCurrentQuestion() {
    return this.currentQuestion;
  }
}

export default TriviaMode;
