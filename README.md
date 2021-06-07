![Node.js CI](https://github.com/nodeshift/rhoaster/workflows/Node.js%20CI/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/nodeshift/rhoaster/badge.svg?branch=main)](https://coveralls.io/github/nodeshift/rhoaster?branch=main)

# rhoaster

A module to help with Node.js OpenShift integration tests.

## Usage

Add `rhoaster` to your project.

```txt
npm install --save-dev rhoaster
```

In your test files, deploy and undeploy your application to whatever
OpenShift instance you are logged into. This works with a local [code-ready-containers](https://developers.redhat.com/products/codeready-containers/overview) installation as well.

Here is an example usage with `tape` and `supertest`.

```js
const test = require('tape');
const request = require('supertest');
const rhoaster = require('rhoaster');

const testEnvironment = rhoaster({
  deploymentName: 'my-nodejs-service'
});

testEnvironment.deploy()
  .then(runTests)
  .then(_ => test.onFinish(testEnvironment.undeploy))
  .catch(console.error);

function runTests (route) {
  test('/api/health/readiness', t => {
    t.plan(1);
    request(route)
    .get('/api/health/readiness')
    .expect(200)
    .expect('Content-Type', /text\/html/)
    .then(response => {
      t.equal(response.text, 'OK');
    })
    .then(_ => t.end())
    .catch(t.fail);
  });
}
```

## Configuration

A few options are accepted by the `rhoaster()` function.

  * `options.projectLocation` is the directory of the project being
    tested. Default: `process.cwd()`.
  * `options.deploymentName` is the name to be used in OpenShift for
    the application under test. Default: `path.basename(process.cwd())`.
  * `options.strictSSL` determines whether a self-signed certificate
    presented by the OpenShift API server is OK. Default: `false`.
  * `options.forceDeploy` tells `rhoaster` to re-deploy the application
    even if a deployment configuration already exists in OpenShift by
    the same `deploymentName`.
