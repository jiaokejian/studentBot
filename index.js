const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Parse JSON bodies
app.use(bodyParser.json());

/**
 * Webhook endpoint for Dialogflow fulfillment
 */
app.post('/webhook', (req, res) => {
  const intentName = req.body.queryResult.intent.displayName;
  let reply = 'Sorry, I am not sure how to answer that.';

  switch (intentName) {
    case 'Course Inquiry':
      reply = 'Sure! You can check the academic calendar on our website, or ask me for specific course details.';
      break;
    case 'Campus Activity Inquiry':
      reply = 'Campus activities are listed on the student portal. Which type of activity interests you?';
      break;
    case 'Common FAQ Inquiry':
      reply = 'The cafeteria opens at 8 AM. You can borrow books with your student card at the library. The campus map is available on the portal.';
      break;
    case 'Clarification Intent':
      reply = 'Could you please clarify your question?';
      break;
    // Add more cases for additional intents
  }

  return res.json({
    fulfillmentText: reply
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server is listening on port ${PORT}`);
});
