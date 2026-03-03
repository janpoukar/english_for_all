require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log(`🚀 Server běží na portu ${PORT} [${NODE_ENV}]`);
});