'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const uniqid = require('uniqid');
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
    const sandboxId = uniqid();
    await docker.command(
      `run --rm --name docker-sandbox -e userCode="${
        req.body.userCode
      }" -e sandboxId="${sandboxId}" -v sharedVol:/usr/src/app/sharedVol -m 20m --kernel-memory 4m --ulimit nproc=10 --cpus 0.25 bonbonbon/docker-sandbox`,
      function(err, data) {
        if (err) {
          console.error(err);
          res.status(400).send('Bad Request: Script execution timed out.');
        } else {
          console.log(data.containerId);
          res.json();
          // fs.readFileSync(path.join(__dirname, `sharedVol/testResult-${sandboxId}.json`));
          // res.json(data.containerId.match('{(.*?)}')[0]);
          // fs.unlinkSync(
          //   path.join(__dirname, `sharedVol/testResult-${sandboxId}.json`)
          // );
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
