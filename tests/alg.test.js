'use strict'

const test = require('ava')

const { zeros, cell, diffuse } = require('../scripts/fluid')

test('fill array with zeros', t => {
  t.deepEqual(zeros(1, 1), [[0]], 'incorrect 1x1 zero filled array')

  t.deepEqual(zeros(2, 2), [[0, 0], [0, 0]], 'incorrect 2x2 zero filled array')
})

test('obtain non-wall cell within array', t => {
  const arr3x3 = zeros(3, 3)

  arr3x3[0][0] = 1
  arr3x3[0][2] = 2
  arr3x3[2][0] = 3
  arr3x3[2][2] = 4

  // center-middle cell
  t.is(cell(arr3x3, 1, 1), 0, 'incorrect valid cell')

  // top-left corner cell
  t.is(cell(arr3x3, 0, 0), 1, 'incorrect valid cell')
  t.is(cell(arr3x3, 0, -1), 0, 'incorrect y-valid cell')
  t.is(cell(arr3x3, -1, 0), 0, 'incorrect x-valid cell')
  t.is(cell(arr3x3, -1, -1), 0, 'incorrect invalid cell')

  // top-right corner cell
  t.is(cell(arr3x3, 0, 2), 2, 'incorrect valid cell')
  t.is(cell(arr3x3, 0, 3), 0, 'incorrect y-valid cell')
  t.is(cell(arr3x3, -1, 0), 0, 'incorrect x-valid cell')
  t.is(cell(arr3x3, -1, 3), 0, 'incorrect invalid cell')

  // bottom-left corner cell
  t.is(cell(arr3x3, 2, 0), 3, 'incorrect valid cell')
  t.is(cell(arr3x3, 2, -1), 0, 'incorrect y-valid cell')
  t.is(cell(arr3x3, 3, 0), 0, 'incorrect x-valid cell')
  t.is(cell(arr3x3, 3, -1), 0, 'incorrect invalid cell')

  // bottom-right corner cell
  t.is(cell(arr3x3, 2, 2), 4, 'incorrect valid cell')
  t.is(cell(arr3x3, 2, 3), 0, 'incorrect y-valid cell')
  t.is(cell(arr3x3, 3, 2), 0, 'incorrect x-valid cell')
  t.is(cell(arr3x3, 3, 3), 0, 'incorrect invalid cell')
})

test('validate diffusion calculation results', t => {
  t.deepEqual(diffuse([1, 0, 0, 0], 0), [1, 0, 0, 0, 1 - 1], '+ve north result failed')
  t.deepEqual(diffuse([0, 2, 0, 0], 0), [0, 0, 0, 0, 0 + 2], '+ve south result failed')
  t.deepEqual(diffuse([0, 0, 3, 0], 0), [0, 0, 3, 0, 3 - 3], '+ve west result failed')
  t.deepEqual(diffuse([0, 0, 0, 4], 0), [0, 0, 0, 0, 0 + 4], '+ve east result failed')

  t.deepEqual(diffuse([-1, 0, 0, 0], 0), [0, 0, 0, 0, 0 + 1], '-ve north result failed')
  t.deepEqual(diffuse([0, -2, 0, 0], 0), [0, 2, 0, 0, 2 - 2], '-ve south result failed')
  t.deepEqual(diffuse([0, 0, -3, 0], 0), [0, 0, 0, 0, 0 + 3], '-ve west result failed')
  t.deepEqual(diffuse([0, 0, 0, -4], 0), [0, 0, 0, 4, 4 - 4], '-ve east result failed')

  t.deepEqual(diffuse([1, 2, 3, 4], 0), [1, 0, 3, 0, 4 + 2], 'all +ve result failed')
  t.deepEqual(diffuse([-1, -2, -3, -4], 0), [0, 2, 0, 4, 6 - 2], 'all -ve result failed')

  t.deepEqual(diffuse([1, 2, 3, 4], 2), [3, 2, 5, 2, 12 + 2], '+ve bias result failed')
  t.deepEqual(diffuse([1, 2, 3, 4], -2), [-1, -2, 1, -2, -4 + 2], '-ve bias result failed')
  t.deepEqual(diffuse([-1, -2, -3, -4], 2), [2, 4, 2, 6, 14 - 2], '+ve bias result failed')
  t.deepEqual(diffuse([-1, -2, -3, -4], -2), [-2, 0, -2, 2, -2 - 2], '-ve bias result failed')
})
