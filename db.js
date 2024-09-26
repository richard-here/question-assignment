const sqlite3 = require('sqlite3').verbose()

// Open a database connection
const db = new sqlite3.Database('mydatabase.db', (err) => {
  if (err) {
    return console.error(err.message)
  }
  console.log('Connected to the SQLite database.')
})

module.exports = db
