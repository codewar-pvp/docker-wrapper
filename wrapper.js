'use strict';

const fs = require('fs');
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

app.post('/', async (req, res, next) => {
  try {
    await docker.command(
      `run --rm --name docker-sandbox -e userCode="${
        req.body.userCode
      }" -m 20m --kernel-memory 4m --ulimit nproc=10 --cpus 0.25 bonbonbon/docker-sandbox`,
      function(err, data) {
        if (err) {
          console.error(err);
          res.status(400).send('Bad Request: Script execution timed out.');
        } else {
          console.log(data.containerId);
          fs.readFileSync();
          res.json(data.containerId.match('{(.*?)}')[0]);
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get('/', (req, res, next) => {
  res.send('docker is running!');
});

app.listen(PORT);
console.log(`Running on port ${PORT}`);
