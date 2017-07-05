'use strict'

const test = require('ava')

const { zeros, cell, edge, slot } = require('../scripts/fluid')

const arr3x3 = zeros(3, 3)

const state3x3 = zeros(3, 3)

arr3x3[0][0] = 1
arr3x3[0][2] = 2
arr3x3[2][0] = 3
arr3x3[2][2] = 4

state3x3[0][0] = 1
state3x3[0][1] = 1
state3x3[0][2] = 1
state3x3[1][2] = 1
state3x3[2][2] = 1
state3x3[2][1] = 1
state3x3[2][0] = 1
state3x3[1][0] = 1

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

test('obtain non-boundary cell within array', t => {
  const arr = arr3x3.map(arr => [...arr])
  const state = state3x3.map(arr => [...arr])

  arr[2][1] = 5
  state[2][1] = 0

  t.is(edge(state, arr, 0, 0, 0, 0), 1, 'valid cell not accepted')
  t.is(edge(state, arr, 0, 0, 2, 2), 1, 'valid cell not accepted')
  t.is(edge(state, arr, 1, 1, 2, 2), 4, 'wall cell not rejected')
  t.is(edge(state, arr, 9, 9, 2, 2), 4, 'edge cell not rejected')

  t.is(edge(state, arr, 9, 9, 0, 1), 0, 'zero cell supplies non-zero value')
  t.is(edge(state, arr, 9, 9, 1, 1), 0, 'valid cell not accepted')
  t.is(edge(state, arr, 9, 9, 2, 1), 0, 'wall cell supplies non-zero value')
})

test('obtain non-boundary slot within array', t => {
  const arr = [
    { density: 0.2 },
    { density: 0.4 },
    { density: 0.6 }
  ]

  t.is(slot(arr, 0).density, 0.2, 'incorrect element found')
  t.is(slot(arr, 1).density, 0.4, 'incorrect element found')
  t.is(slot(arr, 2).density, 0.6, 'incorrect element found')

  t.is(slot(arr, -1).density, 0, 'incorrect boundary condition')
  t.is(slot(arr, 10).density, 0, 'incorrect boundary condition')
})
