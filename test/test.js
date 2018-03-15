'use strict';

const path = require('path');
const test = require('tape');
const rhoaster = require('../');

test('Instance creation', t => {
  t.plan(4);
  const testEnv = rhoaster();
  t.strictEqual(Object.getOwnPropertyNames(testEnv).length, 4);
  t.strictEqual(typeof testEnv.build, 'function', 'has a build function');
  t.strictEqual(typeof testEnv.deploy, 'function', 'has a deploy function');
  t.strictEqual(typeof testEnv.undeploy, 'function', 'has an undeploy function');
  t.end();
});

test('Default options', t => {
  t.plan(5);
  const testEnv = rhoaster();
  t.strictEqual(testEnv.opts.deploymentName, 'rhoaster', 'deploymentName');
  t.strictEqual(path.basename(testEnv.opts.projectLocation), 'rhoaster', 'projectLocation');
  t.false(testEnv.opts.forceDeploy, 'forceDeploy');
  t.false(testEnv.opts.strictSSL, 'strictSSL');
  t.true(testEnv.opts.removeAll, 'removeAll');
  t.end();
});

test('dockerImage and nodeVersion options', t => {
  t.plan(2);
  const options = {
    dockerImage: 'registry.access.redhat.com/rhoar-nodejs/nodejs-8',
    nodeVersion: '8.x'
  };
  const testEnv = rhoaster(options);
  t.strictEqual(testEnv.opts.dockerImage, options.dockerImage, 'dockerImage');
  t.strictEqual(testEnv.opts.nodeVersion, options.nodeVersion, 'nodeVersion');
  t.end();
});
