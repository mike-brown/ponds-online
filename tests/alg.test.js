'use strict'

const test = require('ava')

const { zeros, cell } = require('../scripts/fluid')

const arr3x3 = zeros(3, 3)

arr3x3[0][0] = 1
arr3x3[0][2] = 2
arr3x3[2][0] = 3
arr3x3[2][2] = 4

test('fill array with zeros', t => {
  t.deepEqual(zeros(1, 1), [[0]], 'incorrect 1x1 zero filled array')

  t.deepEqual(zeros(2, 2), [[0, 0], [0, 0]], 'incorrect 2x2 zero filled array')
})

test('obtain non-wall cell within array', t => {
  const arr = arr3x3.map(arr => [...arr])

  // center-middle cell
  t.is(cell(arr, 1, 1), 0, 'incorrect valid cell')

  // top-left corner cell
  t.is(cell(arr, 0, 0), 1, 'incorrect valid cell')
  t.is(cell(arr, 0, -1), 0, 'incorrect y-valid cell')
  t.is(cell(arr, -1, 0), 0, 'incorrect x-valid cell')
  t.is(cell(arr, -1, -1), 0, 'incorrect invalid cell')

  // top-right corner cell
  t.is(cell(arr, 0, 2), 2, 'incorrect valid cell')
  t.is(cell(arr, 0, 3), 0, 'incorrect y-valid cell')
  t.is(cell(arr, -1, 0), 0, 'incorrect x-valid cell')
  t.is(cell(arr, -1, 3), 0, 'incorrect invalid cell')

  // bottom-left corner cell
  t.is(cell(arr, 2, 0), 3, 'incorrect valid cell')
  t.is(cell(arr, 2, -1), 0, 'incorrect y-valid cell')
  t.is(cell(arr, 3, 0), 0, 'incorrect x-valid cell')
  t.is(cell(arr, 3, -1), 0, 'incorrect invalid cell')

  // bottom-right corner cell
  t.is(cell(arr, 2, 2), 4, 'incorrect valid cell')
  t.is(cell(arr, 2, 3), 0, 'incorrect y-valid cell')
  t.is(cell(arr, 3, 2), 0, 'incorrect x-valid cell')
  t.is(cell(arr, 3, 3), 0, 'incorrect invalid cell')
})
