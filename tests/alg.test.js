'use strict'

const test = require('ava')

const { zeros } = require('../scripts/fluid')

test('fill array with zeros', t => {
  t.deepEqual(zeros(1, 1), [[0]], 'incorrect 1x1 zero filled array')

  t.deepEqual(zeros(2, 2), [[0, 0], [0, 0]], 'incorrect 1x1 zero filled array')
})
