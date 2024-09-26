// An object with countryId as key and question (and cycle info) as value
// Used to cache the question of the cycle (relative to current date) for each country
// I.e. will not cache future questions of the cycle
const questionsOfTheCycle = {}

const getQuestionOfTheCycleByCountryId = (countryId) => {
  return questionsOfTheCycle[countryId]
}

const setQuestionOfTheCycleByCountryId = (countryId, question) => {
  questionsOfTheCycle[countryId] = question
}

const clearQuestionOfTheCycleByCountryId = (countryId) => {
  delete questionsOfTheCycle[countryId]
}

const clearQuestionsOfTheCycle = () => {
  for (const countryId in questionsOfTheCycle) {
    clearQuestionOfTheCycleByCountryId(countryId)
  }
}

module.exports = {
  getQuestionOfTheCycleByCountryId,
  setQuestionOfTheCycleByCountryId,
  clearQuestionOfTheCycleByCountryId,
  clearQuestionsOfTheCycle
}