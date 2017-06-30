'use strict'

const CELL_SIZE = 10
const COLS = 79
const ROWS = 19

const params = {
  gamma: 0.2, // interface diffusion
  size: 0.01, // 10mm face area
  rho: 998.2, // 998.2kg/m^3 density
  mu: 0.001 // viscosity
}

const constants = {
  density: params.rho / 2,
  diffuse: params.gamma / params.size
}

function zeros (ROWS, COLS) {
  let grid = []
  for (let j = 0; j < ROWS; j++) {
    let line = []
    for (let i = 0; i < COLS; i++) {
      line.push(0)
    }
    grid.push(line)
  }
  return grid
}

function cell (arr, j, i) {
  const bx = i >= 0 && i < arr[0].length
  const by = j >= 0 && j < arr.length
  const bz = bx && by

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)

  // returns zero if cell does not fall within the supplied array range
  return arr[mj][mi] * bz
}

module.exports = {
  zeros,
  cell
}
