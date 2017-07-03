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

module.exports = {
  CELL_SIZE,
  COLS,
  ROWS,
  params,
  constants
}
