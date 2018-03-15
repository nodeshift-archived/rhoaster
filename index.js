'use strict';

const configLoader = require('openshift-config-loader');
const openshift = require('openshift-rest-client');
const nodeshift = require('nodeshift');
const path = require('path');

/**
 *
 * @param {Object} options - optional configuration parameters
 * @param {String} options.projectLocation - the location of the project under test. Default: process.cwd()
 * @param {String} options.deploymentName - the name of the deployment in your OpenShift cluster.
 *                 Default: path.basename(process.cwd())
 * @param {boolean} options.strictSSL - set to true if a self-signed security certificate is not OK. Default: false
 * @param {boolean} options.forceDeploy - set to true if you would like rhoaster to create a new deployment configuration
 *                  for this application, even if one with options.deploymentName already exists
 * @param {boolean} options.removeAll - set to false if you would like rhoaster to not delete builds and imagestreams. Default: true
 */
function rhoaster (options) {
  const opts = Object.assign({
    projectLocation: process.cwd(),
    deploymentName: path.basename(process.cwd()),
    strictSSL: false,
    removeAll: true
  }, options);
  return {
    deploy: deploy(opts),
    undeploy: undeploy(opts),
    build: build(opts),
    opts
  };
}

function deploy (options) {
  return async () => {
    const config = Object.assign(await configLoader(options), options);
    if (config.forceDeploy) {
      return runDeploy(config);
    }
    return openshift({config, request: { strictSSL: options.strictSSL }}).then(client => {
      return client.deploymentconfigs.find(config.deploymentName)
        .then(result => {
          if (result.code === 404) throw new Error(result.reason);
          console.log(`Deployment ${config.deploymentName} already exists. To force redeployment provide options.forceDeploy=true.`);
          return applyResources(config);
        })
        .catch(_ => {
          console.log('No deployment found. Deploying...');
          return runDeploy(config).then(_ => waitForDeployment(client, config));
        });
    });
  };
}

function undeploy ({ projectLocation, strictSSL, removeAll }) {
  return async () =>
    nodeshift.undeploy({ projectLocation, strictSSL, removeAll });
}

function build ({ projectLocation, strictSSL, dockerImage, nodeVersion }) {
  return async () =>
    nodeshift.build({ projectLocation, strictSSL, dockerImage, nodeVersion });
}

function applyResources ({ projectLocation, strictSSL }) {
  return nodeshift
    .applyResource({ projectLocation, strictSSL })
    .then(getRoute)
    .catch(console.error);
}

function runDeploy ({ projectLocation, strictSSL, dockerImage, nodeVersion }) {
  return nodeshift.deploy({ projectLocation, strictSSL, dockerImage, nodeVersion })
    .then(getRoute)
    .catch(console.error);
}

function getRoute (output) {
  return `http://${output.appliedResources.find(val => val.kind === 'Route').spec.host}`;
}

function wait (timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

async function waitForDeployment (client, config, count) {
  count = count || 0;
  while (count++ < 50) {
    const data = await client.deploymentconfigs.find(config.deploymentName);
    if (data.status.availableReplicas > 0) {
      console.log('');
      return applyResources(config);
    } else {
      process.stdout.write('.');
      await wait(count * 40);
    }
  }
  throw new Error('Service unavailable');
}

module.exports = rhoaster;
