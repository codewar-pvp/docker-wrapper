'use strict';

const fs = require('fs');
const uniqid = require('uniqid');
const express = require('express');
const { promisify } = require('util');
const dockerCLI = require('docker-cli-js');
const DockerOptions = dockerCLI.Options;
const Docker = dockerCLI.Docker;
const docker = new Docker();

const readFileAsync = promisify(fs.readFile);

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/code', async (req, res, next) => {
  try {
    const containerResultObj = {
      passedAllTests: false,
      containerConsoleOutput: '',
    };
    if (req.body.apiKey !== process.env.apiKey) {
      res.sendStatus(401);
    }
    const sandboxId = uniqid();
    console.log('sandboxId:', sandboxId);
    const { apiKey, ...noApiKey } = req.body;
    console.log(noApiKey);
    fs.writeFileSync(`/vol/userCode-${sandboxId}.js`, noApiKey.userCode);
    fs.writeFileSync(`/vol/question.spec-${sandboxId}.js`, noApiKey.testSpecs);
    docker.command(
      `run --name docker-sandbox-${sandboxId} --volumes-from docker-wrapper -e sandboxId="${sandboxId}" -m 80m --kernel-memory 15m --ulimit nproc=10 --cpus 0.5 bonbonbon/docker-sandbox:latest`,
      (containerRunErr, containerRunData) => {
        if (containerRunErr) {
          console.log('containerRunErr!!!\n\n\n', containerRunErr, '\n\n');
          console.error(containerRunErr);
        } else console.log(containerRunData);
        docker.command(
          `inspect docker-sandbox-${sandboxId}`,
          async (containerInspectErr, containerInspectData) => {
            const containerState = containerInspectErr
              ? console.error(containerInspectErr)
              : JSON.parse(containerInspectData.raw)[0].State;
            if (containerState) console.log(containerState);
            // if tests do not fail, there are no syntax errors,
            // and container does not crash from resource abuse, then user
            // has passed all tests:
            if (!containerRunErr && !containerState.OOMKilled) {
              containerResultObj.passedAllTests = true;
            }
            try {
              const result = await readFileAsync(
                `/vol/results-${sandboxId}.txt`
              );
              containerResultObj.containerConsoleOutput = result.toString();
            } catch (containerConsoleOutputFileReadErr) {
              console.error(containerConsoleOutputFileReadErr);
            }
            if (containerState.OOMKilled) {
              containerResultObj.containerConsoleOutput =
                'Out of memory resources - please revise your code and be mindful of resource abuse.';
            }
            console.log(containerState.OOMKilled);
            res.status(201).json(containerResultObj);
            fs.unlink(`/vol/results-${sandboxId}.txt`, err => {
              if (err) next(err);
            });
            docker.command(
              `stop docker-sandbox-${sandboxId}; docker rm docker-sandbox-${sandboxId}`,
              (containerStopRmErr, containerStopRmData) => {
                containerStopRmErr
                  ? console.error(containerStopRmErr)
                  : console.log(containerStopRmData);
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.listen(PORT);
console.log(`Running on port ${PORT}`);
