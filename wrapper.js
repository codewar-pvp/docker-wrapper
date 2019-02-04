'use strict';

const fs = require('fs');
const uniqid = require('uniqid');
const express = require('express');
const dockerCLI = require('docker-cli-js');
const DockerOptions = dockerCLI.Options;
const Docker = dockerCLI.Docker;
const docker = new Docker();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/code', async (req, res, next) => {
  try {
    if (req.body.apiKey !== process.env.apiKey) {
      res.sendStatus(401);
    }
    const sandboxId = uniqid();
    console.log(sandboxId);
    const { apiKey, ...noApiKey } = req.body;
    console.log(noApiKey);
    fs.writeFileSync(`/vol/userCode-${sandboxId}.js`, noApiKey.userCode);
    fs.writeFileSync(`/vol/question.spec-${sandboxId}.js`, noApiKey.testSpecs);
    await docker.command(
      `run --rm --name docker-sandbox --volumes-from docker-wrapper -e sandboxId="${sandboxId}" bonbonbon/docker-sandbox:latest`,
      function(err, data) {
        if (err) {
          console.error(err);
        } else {
          console.log(data.containerId);
          res
            .status(201)
            .sendFile(`/vol/results-${sandboxId}.txt`, null, function(fileErr) {
              if (fileErr) {
                next(fileErr);
              } else {
                console.log(`sent /vol/results-${sandboxId}.txt`);
              }
              fs.unlinkSync(`/vol/results-${sandboxId}.txt`);
            });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.listen(PORT);
console.log(`Running on port ${PORT}`);
