// Trivia API Service - Fetches questions from Open Trivia DB API
// https://opentdb.com/api_config.php

const OPENTDB_BASE_URL = 'https://opentdb.com/api.php';

// Decode HTML entities in questions/answers from the API
const decodeHtmlEntities = (text) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

// Transform with correct answer index tracking
const transformQuestionWithCorrectIndex = (apiQuestion, index) => {
  const correctAnswer = decodeHtmlEntities(apiQuestion.correct_answer);
  const incorrectAnswers = apiQuestion.incorrect_answers.map(decodeHtmlEntities);
  const allOptions = [...incorrectAnswers, correctAnswer];
  
  // Fisher-Yates shuffle
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }
  
  // Find the new index of the correct answer
  const correctIndex = allOptions.indexOf(correctAnswer);
  
  return {
    id: `api-${Date.now()}-${index}`,
    question: decodeHtmlEntities(apiQuestion.question),
    options: allOptions,
    correctAnswer: correctIndex,
    category: apiQuestion.category
  };
};

/**
 * Fetch trivia questions from Open Trivia DB API
 * @param {number} amount - Number of questions to fetch (max 50)
 * @param {string} difficulty - Optional difficulty level: 'easy', 'medium', 'hard'
 * @param {number} category - Optional category ID (see https://opentdb.com/api_category.php)
 * @returns {Promise<Array>} Array of question objects
 */
export const fetchTriviaQuestions = async (amount = 10, difficulty = null, category = null) => {
  const params = new URLSearchParams({
    amount: Math.min(amount, 50).toString(),
    type: 'multiple' // Only multiple choice questions
  });
  
  if (difficulty) {
    params.append('difficulty', difficulty);
  }
  
  if (category) {
    params.append('category', category.toString());
  }

  const url = `${OPENTDB_BASE_URL}?${params.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Response codes: 0 = Success, 1 = No Results, 2 = Invalid Parameter, 3 = Token Not Found, 4 = Token Empty
  if (data.response_code !== 0) {
    throw new Error(`API error! response_code: ${data.response_code}`);
  }
  
  return data.results.map(transformQuestionWithCorrectIndex);
};

/**
 * Fetch available categories from Open Trivia DB
 * @returns {Promise<Array>} Array of category objects with id and name
 */
export const fetchCategories = async () => {
  const response = await fetch('https://opentdb.com/api_category.php');
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.trivia_categories;
};

export default {
  fetchTriviaQuestions,
  fetchCategories
};
