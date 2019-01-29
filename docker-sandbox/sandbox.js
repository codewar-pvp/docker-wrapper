const { VM } = require('vm2');

const vm = new VM({
  timeout: 5000,
  sandbox: {
    console: {
      log(logStr) {
        this.logHistory.push(logStr.toString());
      },
      logHistory: [],
    },
  },
});
