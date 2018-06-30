'use strict';
const common = require('../common');
const assert = require('assert');
const async_hooks = require('async_hooks');

if (!common.isMainThread)
  common.skip('Worker bootstrapping works differently -> different async IDs');

common.crashOnUnhandledRejection();

const promiseAsyncIds = [];

async_hooks.createHook({
  init: common.mustCallAtLeast((id, type, triggerId) => {
    if (type === 'PROMISE') {
      // Check that the last known Promise is triggering the creation of
      // this one.
      assert.strictEqual(promiseAsyncIds[promiseAsyncIds.length - 1] || 1,
                         triggerId);
      promiseAsyncIds.push(id);
    }
  }, 3),
  before: common.mustCall((id) => {
    assert.strictEqual(id, promiseAsyncIds[1]);
  }),
  after: common.mustCall((id) => {
    assert.strictEqual(id, promiseAsyncIds[1]);
  })
}).enable();

Promise.resolve(42).then(common.mustCall(() => {
  assert.strictEqual(async_hooks.executionAsyncId(), promiseAsyncIds[1]);
  assert.strictEqual(async_hooks.triggerAsyncId(), promiseAsyncIds[0]);
  Promise.resolve(10);
}));
