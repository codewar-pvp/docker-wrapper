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
    fs.writeFileSync(
      `/vol/results-${sandboxId}.json`,
      JSON.stringify(noApiKey)
    );
    await docker.command(
      `run --rm --name docker-sandbox --volumes-from docker-wrapper -e sandboxId="${sandboxId}" bonbonbon/docker-sandbox:latest`,
      function(err, data) {
        if (err) {
          console.error(err);
          // res.status(400).send('Bad Request: Script execution timed out.');
          res
            .status(400)
            .sendFile(`/vol/results-${sandboxId}.txt`, null, function(fileErr) {
              if (fileErr) {
                next(fileErr);
              } else {
                console.log('file sent');
              }
              fs.unlinkSync(`/vol/results-${sandboxId}.json`);
              fs.unlinkSync(`/vol/results-${sandboxId}.txt`);
            });
        } else {
          console.log(data.containerId);
          res.sendFile(`/vol/results-${sandboxId}.txt`, null, function(
            fileErr
          ) {
            if (fileErr) {
              next(fileErr);
            } else {
              console.log('file sent');
            }
            fs.unlinkSync(`/vol/results-${sandboxId}.json`);
            fs.unlinkSync(`/vol/results-${sandboxId}.txt`);
          });
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

app.get('/', (req, res, next) => {});

app.listen(PORT);
console.log(`Running on port ${PORT}`);
