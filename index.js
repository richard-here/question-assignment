const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const app = express()
const port = 3000

// Runs the seedDb function
require('./seedDb')

const db = require('./db')
const Joi = require('joi')
const { clearQuestionsOfTheCycle, getQuestionOfTheCycleByCountryId, setQuestionOfTheCycleByCountryId } = require('./cache')

const patchCycleConfigBodySchema = Joi.object({
  cycleDuration: Joi.number().integer().min(1).max(365).required()
})

const getCountryQuestionPathSchema = Joi.object({
  countryId: Joi.number().integer().min(1).required()
})

const getCountryQuestionQuerySchema = Joi.object({
  cycle: Joi.number().integer().min(1)
})

app.use(express.json())

app.get('/cycle-config', (req, res) => {
  db.get('SELECT * FROM config LIMIT 1', (err, row) => {
    if (err) {
      return console.error(err.message)
    }
    res.json({ data: row })
  })
})

app.patch('/cycle-config', async (req, res) => {
  const { error } = patchCycleConfigBodySchema.validate(req.body)
  if (error) {
    res.status(400).send({
      error: error
    })
    return
  }

  await new Promise((resolve, _) => {
    db.run('UPDATE config SET cycleDuration = ?', [Number.parseInt(req.body.cycleDuration)], (err) => {
      if (err) {
        return console.error(err.message)
      }

      resolve()
    })
  })

  const newCycleConfig = await new Promise((resolve, _) => {
    db.get('SELECT * FROM config LIMIT 1', (err, row) => {
      if (err) {
        return console.error(err.message)
      }

      resolve(row)
    })
  })

  clearQuestionsOfTheCycle()

  res.send({
    data: newCycleConfig
  })
})

app.get('/countries/:countryId/question', async (req, res) => {
  let { error } = getCountryQuestionQuerySchema.validate(req.query)
  if (error) {
    res.status(400).send({
      error: error
    })
    return
  }
  req.query.cycle = Number.parseInt(req.query.cycle)

  ;({ error } = getCountryQuestionPathSchema.validate(req.params))
  if (error) {
    res.status(400).send({
      error: error
    })
    return
  }

  const cachedQuestionOfTheCycle = getQuestionOfTheCycleByCountryId(req.params.countryId)
  if (cachedQuestionOfTheCycle) {
    // Removes cache if the cached cycle has ended
    if (
      new Date(cachedQuestionOfTheCycle.cycleEndDate) <= new Date()
    ) {
      clearQuestionsOfTheCycle(req.params.countryId)
    } else {
      // Returns the cached data if the requested question is the currently active one (i.e. the cycle number is the same)
      if (cachedQuestionOfTheCycle.cycleNumber === req.query.cycle) {
        res.send({
          data: cachedQuestionOfTheCycle
        })
        return
      }
    }
  }

  const countryPromise = new Promise((resolve, _) => {
    db.get('SELECT * FROM countries WHERE ID = ?', [req.params.countryId], (err, row) => {
      if (err) {
        console.error(err.message)
        return
      }

      if (!row) {
        res.status(404).send({
          error: 'Country not found'
        })
        return
      }

      resolve(row)
    })
  })

  const cycleConfigPromise = new Promise((resolve, _) => {
    db.get('SELECT * FROM config LIMIT 1', (err, row) => {
      if (err) {
        console.error(err.message)
        return
      }

      resolve(row)
    })
  })
  
  const questionCountPromise = new Promise((resolve, _) => {
    db.get('SELECT COUNT(*) AS count FROM questions', (err, row) => {
      if (err) {
        console.error(err.message)
        return
      }

      resolve(row.count)
    })
  })

  const [country, cycleConfig, questionCount] = await Promise.all([countryPromise, cycleConfigPromise, questionCountPromise])

  const startDate = new Date(cycleConfig.startDate)
  let cycle = null
  if (req.query.cycle) cycle = req.query.cycle - 1 // -1 because the cycle is 1-indexed
  else {
    const now = new Date()
    const msInCycle = 1000 * 60 * 60 * 24 * cycleConfig.cycleDuration
    cycle = Math.floor((now - startDate) / msInCycle) // rounds down the diff in days (diff in ms in a day)
  }

  let questionNumber = (country.ID + cycle) % (questionCount + 1) // +1 because the question count is 1-indexed
  questionNumber = questionNumber === 0 ? questionNumber + 1 : questionNumber // if the question number is 0, set it to 1 because it's 1-indexed
  const question = await new Promise((resolve, _) => {
    db.get('SELECT * FROM questions WHERE ID = ?', [questionNumber], (err, row) => {
      if (err) {
        console.error(err.message)
        return
      }

      resolve(row)
    })
  })

  const cycleStartDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * cycleConfig.cycleDuration * cycle)
  const cycleEndDate = new Date(cycleStartDate.getTime() + 1000 * 60 * 60 * 24 * cycleConfig.cycleDuration - 1)

  const responseData = {
    countryId: country.ID,
    countryName: country.name,
    questionId: question.ID,
    question: question.name,
    cycleNumber: cycle + 1, // +1 because the cycle is 1-indexed
    cycleStartDate: cycleStartDate.toISOString(),
    cycleEndDate: cycleEndDate.toISOString()
  }

  const now = new Date()
  // Caches the question of the cycle if the requested cycle is for the currently active one
  if (cycleStartDate <= now && now <= cycleEndDate) {
    setQuestionOfTheCycleByCountryId(country.ID, responseData)
  }

  res.send({
    data: responseData
  })
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})