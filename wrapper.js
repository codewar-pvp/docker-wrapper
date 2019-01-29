'use strict';

const express = require('express');
const axios = require('axios');

// Constants
const PORT = process.env.PORT || 5000;

// App
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res, next) => {
  try {
    res.send('docker is running!');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// router.post('/', async (req, res, next) => {
//   try {
//     const result = vm.run(`(
//             (${req.body.input})()`)
//     res.json({
//       output: result
//     })
//   } catch (err) {
//     if (err.message === 'Script execution timed out.') {
//       err.status = 400
//     }
//     next(err)
//   }
// })

app.listen(PORT);
console.log(`Running on port ${PORT}`);
