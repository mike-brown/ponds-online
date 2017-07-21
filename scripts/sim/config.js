'use strict'

const params = {
  gamma: 0.02, // interface diffusion
  size: 0.01, // 10mm face area
  rho: 998.2, // 998.2kg/m^3 density
  mu: 0.001002, // dynamic viscosity
  nu: 0.000001004, // kinematic viscosity
  input: {
    x: 0.0005, // inlet velocity in the x-axis
    y: 0.0 // inlet velocity in the y-axis
  },
  plant: [
    { diameter: 1.0, phi: 0.0, state: 10 }, // water
    { diameter: 0.01, phi: 0.013, state: 11 }, // winter plants
    { diameter: 0.019, phi: 0.047, state: 12 } // summer plants
  ]
}

const plants = params.plant.map(plant => {
  return [
    plant.diameter, // diameter
    plant.phi, // phi
    plant.state, // state
    7276.43 * plant.diameter + 23.55, // a0 value
    32.7 * plant.diameter + 3.01 * plant.phi + 0.42 // a1
  ]
})

module.exports = {
  defaultSize: {
    cell: 10,
    cols: 40,
    rows: 10
  },
  params,
  values: {
    density: params.rho / 2,
    diffuse: params.gamma / params.size
  },
  plants
}
