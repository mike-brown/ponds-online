'use strict'

const cols = 27
const rows = 9

let pressurePrevP = zeros(cols, rows) // I,J
let velocityPrevX = zeros(cols + 1, rows + 1) // i,J
let velocityPrevY = zeros(cols + 1, rows + 1) // I,j

let pressureTempP
let velocityTempX
let velocityTempY

let pressureNextP
let velocityNextX
let velocityNextY

const params = {
  size: 0.01, // 10mm face area
  rho: 998.2, // 998.2kg/m^3 density
  mu: 0.0 // viscosity
}

function zeros (cols, rows) {
  let grid = []
  for (let y = 0; y < cols; y++) {
    let line = []
    for (let x = 0; x < rows; x++) {
      line.push({
        pressure: 0, // pressure
        velocity: {
          x: 0, // velocity (x-axis)
          y: 0 // velocity (y-axis)
        }
      })
    }
    grid.push(line)
  }
  return grid
}
