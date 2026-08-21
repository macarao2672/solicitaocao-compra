import express from 'express';
const app = express();
app.post(['/a', '/b'], (req, res) => res.json({ok: true}));
app.listen(3001, () => {
  console.log('Listening');
});
