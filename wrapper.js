'use strict';

const express = require('express');
const dockerCLI = require('docker-cli-js');
const DockerOptions = dockerCLI.Options;
const Docker = dockerCLI.Docker;
const docker = new Docker();

// Constants
const PORT = process.env.PORT || 5000;

// App
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/code', async (req, res, next) => {
  try {
    await docker.command(
      `run --rm --name docker-sandbox -e userCode="${
        req.body.userCode
      }" -m 80m --kernel-memory 25m --ulimit nproc=15 --cpus 1 bonbonbon/docker-sandbox:latest`,
      function(err, data) {
        if (err) {
          console.error(err);
          res.status(400).send('Bad Request: Script execution timed out.');
        } else {
          console.log(data.containerId);
          const result = data.containerId
            .split('> node sandbox.js')[1]
            .replace('\\n', '');
          const parsedResult = JSON.parse(result);
          res.send(parsedResult);
        }
      }
    );
  } catch (error) {
    console.error(error);
    if (error.name === 'SyntaxError') {
      res.status(400).send('Bad Request: Script execution timed out.');
    } else res.status(500).send(error);
  }
});

app.get('/', (req, res, next) => {
  res.send('docker is running!');
});

app.listen(PORT);
console.log(`Running on port ${PORT}`);
