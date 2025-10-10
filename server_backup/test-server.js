const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', message: 'Test server is running' });
});

app.post('/generate', async (req, res) => {
  console.log('Generate requested with body:', req.body);
  res.json({
    success: true,
    questions: [{
      id: 'test123',
      type: 'vocab',
      word: 'Test',
      definition: 'A test word',
      imageUrl: 'https://example.com/test.jpg'
    }],
    count: 1
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});