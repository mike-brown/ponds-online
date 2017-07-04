'use strict'

const CELL_SIZE = 10
const COLS = 79
const ROWS = 19

const params = {
  gamma: 0.2, // interface diffusion
  size: 0.01, // 10mm face area
  rho: 998.2, // 998.2kg/m^3 density
  mu: 0.001002, // dynamic viscosity
  nu: 0.000001004, // kinematic viscosity
  input: {
    x: 0.00005,
    y: 0
  },
  plant: [
    { density: 0.8, diameter: 0.3 },
    { density: 0.5, diameter: 0.001 }
  ]
}

const values = {
  density: params.rho / 2,
  diffuse: params.gamma / params.size
}

const plants = []

// initialises plant constants
for (let n = 0; n < params.plant.length; n++) {
  plants.push({
    density: params.plant[n].density,
    diameter: params.plant[n].diameter,
    phi: 0,
    force: 0,
    a0: 0,
    a1: 0
  })

  plants[n].phi = Math.PI / (4 * plants[n].density * Math.pow(plants[n].diameter, 2))
  plants[n].a0 = 7276.43 * plants[n].diameter + 23.55
  plants[n].a1 = 32.7 * plants[n].density + 3.01 * plants[n].phi + 0.42
}

module.exports = {
  CELL_SIZE,
  COLS,
  ROWS,
  params,
  values,
  plants
}
