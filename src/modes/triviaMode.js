// Trivia Mode - Questions appear for all players, correct answers give speed boosts

import { TRACK_LENGTH_CONFIG } from '../core/raceEngine';
import { fetchTriviaQuestions } from '../core/triviaApi';

// Fallback trivia questions used when API is unavailable
export const fallbackQuestions = [
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

// Get a random question that hasn't been asked recently (used for fallback questions)
export const getRandomQuestion = (usedQuestionIds = [], questions = fallbackQuestions) => {
  const availableQuestions = questions.filter(q => !usedQuestionIds.includes(q.id));
  if (availableQuestions.length === 0) {
    // Reset if all questions used
    return questions[Math.floor(Math.random() * questions.length)];
  }
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
};

// Check if answer is correct (works with both API and fallback questions)
export const checkAnswer = (question, answerIndex) => {
  if (!question) return false;
  return question.correctAnswer === answerIndex;
};

// Trivia Mode Controller
export class TriviaMode {
  constructor(onQuestion, onResult, trackLength = 6) {
    this.onQuestion = onQuestion;
    this.onResult = onResult;
    this.trackLength = trackLength;
    this.maxQuestions = TRACK_LENGTH_CONFIG[trackLength]?.triviaQuestions || 6;
    this.usedQuestionIds = [];
    this.questionsAsked = 0;
    this.currentQuestion = null;
    this.questionTimeout = null;
    this.intervalId = null;
    this.isActive = false;
    this.playerAnswers = {};
    this.apiQuestions = []; // Questions fetched from API
    this.useApi = true; // Whether to use API or fallback
  }

  async start() {
    this.isActive = true;
    this.usedQuestionIds = [];
    this.questionsAsked = 0;
    
    // Try to fetch questions from the API
    try {
      this.apiQuestions = await fetchTriviaQuestions(this.maxQuestions + 5); // Fetch extra for variety
      this.useApi = true;
    } catch (error) {
      console.warn('Failed to fetch trivia questions from API, using fallback:', error);
      this.useApi = false;
    }
    
    this.askQuestion();
    
    // Set up interval for new questions
    this.intervalId = setInterval(() => {
      if (this.isActive && this.questionsAsked < this.maxQuestions) {
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
    // Check if we've reached the question limit
    if (this.questionsAsked >= this.maxQuestions) {
      return;
    }

    // Get question from API or fallback
    if (this.useApi && this.apiQuestions.length > 0) {
      // Use questions from API
      const availableApiQuestions = this.apiQuestions.filter(q => !this.usedQuestionIds.includes(q.id));
      if (availableApiQuestions.length > 0) {
        this.currentQuestion = availableApiQuestions[0];
      } else {
        // All API questions used, try fallback
        this.currentQuestion = getRandomQuestion(this.usedQuestionIds);
      }
    } else {
      // Use fallback questions
      this.currentQuestion = getRandomQuestion(this.usedQuestionIds);
    }
    
    this.usedQuestionIds.push(this.currentQuestion.id);
    this.questionsAsked++;
    this.playerAnswers = {};
    
    if (this.onQuestion) {
      this.onQuestion({
        ...this.currentQuestion,
        startTime: Date.now(),
        timeout: TRIVIA_CONFIG.answerTimeout,
        questionNumber: this.questionsAsked,
        totalQuestions: this.maxQuestions
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

    const isCorrect = checkAnswer(this.currentQuestion, answerIndex);
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

  getQuestionsAsked() {
    return this.questionsAsked;
  }

  getMaxQuestions() {
    return this.maxQuestions;
  }
}

export default TriviaMode;
