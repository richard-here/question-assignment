const db = require('./db')
const countries = require('./countries')

// Function to insert the initial configuration with an ISO string
const insertInitialConfig = () => {
  db.run(`CREATE TABLE IF NOT EXISTS config (
    ID INTEGER PRIMARY KEY CHECK (ID = 1),
    cycleDuration INTEGER DEFAULT 7,
    startDate TEXT
  )`)
  const isoString = '2024-09-25T11:00:00.000Z' // 7PM in Singapore on the 25th of September 2024
  // Create a table if it doesn't exist
  db.run(`INSERT INTO config (ID, startDate) VALUES (1, ?)`, [isoString], (err) => {
    if (err) {
      return console.error(err.message)
    }
    console.log('Initial configuration with ISO date inserted.')
  })
}

// Function to insert countries
const seedCountries = () => {
  // Create a table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS countries (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )`)
  let stmt = db.prepare(`INSERT INTO countries (name) VALUES (?)`)

  countries.forEach((country) => {
    stmt.run(country.name)
  })

  stmt.finalize()
}

// Function to insert 1000 entries
const seedQuestions = () => {
  // Create a table for configurations
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )`)
  let stmt = db.prepare(`INSERT INTO questions (name) VALUES (?)`)

  for (let i = 1; i <= 1000; i++) {
    stmt.run(`Question ${i}`)
  }

  stmt.finalize()
}

// Seed the database
db.serialize(() => {
  db.run('DROP TABLE IF EXISTS questions')
  db.run('DROP TABLE IF EXISTS countries')
  db.run('DROP TABLE IF EXISTS config')
  insertInitialConfig()
  seedQuestions()
  seedCountries()
})