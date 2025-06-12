// index.js

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');

const app = express();
app.use(bodyParser.json());

// 1. Create a MySQL connection pool
const pool = mysql.createPool({
  host: 'YOUR_DB_HOST',       // database host
  port: 3306,                 // default MySQL port
  user: 'YOUR_DB_USER',       // database username
  password: 'YOUR_DB_PASS',   // database password
  database: 'studentqa',      // database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Query the database for an answer based on the intent name and user question
 * @param {string} intentName - Dialogflow Intent displayName
 * @param {string} userQuestion - The raw user query text
 * @returns {Promise<string|null>} - Returns the matched answer text, or null if none found
 */
async function queryAnswer(intentName, userQuestion) {
  // 1) Find the corresponding question ID
  const [qs] = await pool.query(
    `SELECT id FROM questions
     WHERE intent_name = ? AND question_text = ?`,
    [intentName, userQuestion]
  );
  if (qs.length === 0) {
    return null;
  }

  // 2) Retrieve the associated answer
  const questionId = qs[0].id;
  const [as] = await pool.query(
    `SELECT a.answer_text
     FROM answers a
     JOIN qna_map m ON a.id = m.answer_id
     WHERE m.question_id = ?`,
    [questionId]
  );
  if (as.length === 0) {
    return null;
  }

  // Return the first answer (could be randomized or rotated)
  return as[0].answer_text;
}

// Webhook endpoint for Dialogflow
app.post('/webhook', async (req, res) => {
  try {
    const intentName = req.body.queryResult.intent.displayName;
    const userText   = req.body.queryResult.queryText;

    // Try fetching an answer from the database
    const dbAnswer = await queryAnswer(intentName, userText);
    if (dbAnswer) {
      return res.json({ fulfillmentText: dbAnswer });
    }

    // Fallback replies if no database entry is found
    let fallbackReply = 'Sorry, I am not sure how to answer that.';
    switch (intentName) {
      case 'Course Inquiry':
        fallbackReply = 'Sure! You can check the academic calendar on our website, or ask me for specific course details.';
        break;
      case 'Campus Activity Inquiry':
        fallbackReply = 'Campus activities are listed on the student portal. Which type of activity interests you?';
        break;
      case 'Common FAQ Inquiry':
        fallbackReply = 'The cafeteria opens at 8 AM. You can borrow books with your student card at the library. The campus map is available on the portal.';
        break;
      case 'Clarification Intent':
        fallbackReply = 'Could you please clarify your question?';
        break;
      // Add more cases for additional intents if needed
    }

    return res.json({ fulfillmentText: fallbackReply });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.json({ fulfillmentText: 'Internal server error.' });
  }
});

// Start the HTTP server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server is listening on port ${PORT}`);
});
