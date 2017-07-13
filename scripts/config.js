'use strict'

const CELL_SIZE = 10
const COLS = 80
const ROWS = 20

const params = {
  gamma: 0.2, // interface diffusion
  size: 0.05, // 10mm face area
  rho: 998.2, // 998.2kg/m^3 density
  mu: 0.001002, // dynamic viscosity
  nu: 0.000001004, // kinematic viscosity
  input: {
    x: 0.0005,
    y: 0.0
  },
  plant: [
    { diameter: 1.000, phi: 0.000, state: 10 },
    { diameter: 0.010, phi: 0.013, state: 11 },
    { diameter: 0.019, phi: 0.047, state: 12 }
  ]
}

const values = {
  density: params.rho / 2,
  diffuse: params.gamma / params.size
}

const plants = []

// initialises plant constants
for (let n = 0; n < params.plant.length; n++) {
  plants.push([
    params.plant[n].diameter, // diameter
    params.plant[n].phi, // phi
    params.plant[n].state, // state
    0, // a0
    0 // a1
  ])

  plants[n][3] = 7276.43 * plants[n][0] + 23.55
  plants[n][4] = 32.7 * plants[n][0] + 3.01 * plants[n][1] + 0.42
}

module.exports = {
  CELL_SIZE,
  COLS,
  ROWS,
  params,
  values,
  plants
}
