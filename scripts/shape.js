'use strict'

const row = 9
const col = 15

const rows = 2 * row + 1
const cols = 2 * col + 1

var curr = zeros(rows, cols) // new values
var prev = zeros(rows, cols) // old values
var tmpv = zeros(rows, cols) // estimated velocity values
var tmpp = zeros(rows, cols) // estimated pressure values

const time = 1.0 // 1s interval
const size = 0.01 // 10mm cell
const rho = 998.2 // 998.2kg/m^3 density
const mu = 0 // viscosity

function zeros (rows, cols) {
  let grid = []
  for (let y = 0; y < rows; y++) {
    let line = []
    for (let x = 0; x < cols; x++) {
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

function couple (prev, dvrg) {
  let grid = []
  for (let y = 0; y < prev.length; y++) {
    let line = []
    for (let x = 0; x < prev[y].length; x++) {
      // if not active, ignore

      let v = {
        n: border(prev, { x: x, y: y - 2 }),
        s: border(prev, { x: x, y: y + 2 }),
        e: border(prev, { x: x + 2, y: y }),
        w: border(prev, { x: x - 2, y: y })
      }

      let p = {
        n: border(prev, { x: x, y: y - 1 }),
        s: border(prev, { x: x, y: y + 1 }),
        e: border(prev, { x: x + 1, y: y }),
        w: border(prev, { x: x - 1, y: y })
      }

      let vx = v.e.x + v.w.x + v.s.x + v.n.x + (p.w.p - p.e.p) * size
      let vy = v.e.y + v.w.y + v.s.y + v.n.y + (p.n.p - p.s.p) * size

      line.push({
        pressure: prev[y][x].pressure,
        velocity: {
          x: vx,
          y: vy
        }
      })
    }
    grid.push(line)
  }

  return grid
}

// function advect (prev) {
//   let arr = zeros(rows, cols)
//
//   for (let y = 0; y < prev.length; y++) {
//     for (let x = 0; x < prev[y].length; x++) {
//       let ox = x - prev[y][x].velocity.x * time
//       let oy = y - prev[y][x].velocity.y * time
//
//       let qxy = {
//         x: parseInt(Math.floor(ox)),
//         y: parseInt(Math.floor(oy))
//       }
//
//       let q11 = {
//         x: qxy.x,
//         y: qxy.y
//       }
//
//       let q12 = {
//         x: qxy.x,
//         y: qxy.y + 1
//       }
//
//       let q21 = {
//         x: qxy.x + 1,
//         y: qxy.y
//       }
//
//       let q22 = {
//         x: qxy.x + 1,
//         y: qxy.y + 1
//       }
//
//       arr[y][x] = bilinear(prev, x, y, ox, oy, q11, q12, q21, q22)
//     }
//   }
//   return arr
// }

// function bilinear (arr, x, y, ox, oy, q11, q12, q21, q22) {
//   const d = {
//     x: ox,
//     y: oy,
//     x1: q11.x,
//     y1: q11.y,
//     x2: q22.x,
//     y2: q22.y,
//
//     v11: border(arr, q11),
//     v12: border(arr, q12),
//     v21: border(arr, q21),
//     v22: border(arr, q22)
//   }
//
//   let term = 1 / (d.x2 - d.x1) * (d.y2 - d.y1)
//
//   // performs x-axis velocity computation of interpolation
//   let vx = (((d.x2 - d.x) * d.v11.x) + ((d.x - d.x1) * d.v21.x)) * (d.y2 - d.y) +
//            (((d.x2 - d.x) * d.v12.x) + ((d.x - d.x1) * d.v22.x)) * (d.y - d.y1)
//
//   // performs y-axis velocity computation of interpolation
//   let vy = (((d.x2 - d.x) * d.v11.y) + ((d.x - d.x1) * d.v21.y)) * (d.y2 - d.y) +
//            (((d.x2 - d.x) * d.v12.y) + ((d.x - d.x1) * d.v22.y)) * (d.y - d.y1)
//
//   return {
//     pressure: arr[y][x].pressure,
//     velocity: {
//       x: term * vx,
//       y: term * vy
//     }
//   }
// }

function border (arr, q) {
  let v = {
    p: 0,
    x: 0,
    y: 0
  }

  if (q.y >= 0 && q.y < arr.length && q.x >= 0 && q.x < arr[q.y].length) {
    v = {
      p: arr[q.y][q.x].pressure,
      x: arr[q.y][q.x].velocity.x,
      y: arr[q.y][q.x].velocity.y
    }
  }

  return v
}

function diverge (tmpv) {
  let grid = []
  for (let y = 0; y < tmpv.length; y++) {
    let line = []
    for (let x = 0; x < tmpv[y].length; x++) {
      // if not active, ignore

      let v = {
        n: border(tmpv, { x: x, y: y - 1 }),
        e: border(tmpv, { x: x + 1, y: y }),
        s: border(tmpv, { x: x, y: y + 1 }),
        w: border(tmpv, { x: x - 1, y: y })
      }

      let term = size * rho // / time

      line.push(term * (v.w.x - v.e.x + v.n.y - v.s.y))
    }
    grid.push(line)
  }

  return grid
}

function jacobi (prev, dvrg) {
  let arr = zeros(rows, cols)
  for (let y = 0; y < prev.length; y++) {
    for (let x = 0; x < prev[y].length; x++) {
      // if not active, ignore

      let p = {
        n: border(prev, { x: x, y: y - 2 }),
        e: border(prev, { x: x + 2, y: y }),
        s: border(prev, { x: x, y: y + 2 }),
        w: border(prev, { x: x - 2, y: y })
      }

      let term = (dvrg[y][x] + p.e.p + p.w.p + p.s.p + p.n.p) // calculates pressure difference
      arr[y][x].pressure = term

      if (prev[y][x].velocity.x === 0.0004991) console.log('velo: (' + x, y + ')')

      arr[y][x].velocity = {
        x: prev[y][x].velocity.x, // preserves old x-axis velocity
        y: prev[y][x].velocity.y // preserves old y-axis velocity
      }
    }
  }
  return arr
}

// function gradient (curr, prev) {
//   let arr = zeros(rows, cols)
//   for (let y = 0; y < prev.length; y++) {
//     for (let x = 0; x < prev[y].length; x++) {
//       // make current velocity using current pressure and past velocity
//
//       // doesn't calculate if velocity cells aren't against a wall, unless designated as inlet or outlet
//       if ((y - 2 >= 0 && y + 2 < arr.length && x - 2 >= 0 && x + 2 < arr[y].length)) {
//         let p = {
//           n: border(curr, { x: x, y: y - 2 }),
//           e: border(curr, { x: x + 2, y: y }),
//           s: border(curr, { x: x, y: y + 2 }),
//           w: border(curr, { x: x - 2, y: y })
//         }
//
//         let term = (time / (2 * size * rho))
//
//         arr[y][x].velocity = {
//           x: prev[y][x].velocity.x - term * (p.e.p - p.w.p),
//           y: prev[y][x].velocity.y - term * (p.s.p - p.n.p)
//         }
//       }
//
//       arr[y][x].pressure = curr[y][x].pressure
//     }
//   }
//   return arr
// }

function draw (arr) {
  let ctxp = document.getElementById('pcanvas').getContext('2d')
  let ctxv = document.getElementById('vcanvas').getContext('2d')

  ctxp.clearRect(0, 0, ctxp.canvas.width, ctxp.canvas.height)
  ctxv.clearRect(0, 0, ctxv.canvas.width, ctxv.canvas.height)

  let maxp = 0
  let maxx = 0
  let maxy = 0

  let sump = 0

  for (let y = 0; y < arr.length; y++) {
    for (let x = 0; x < arr[y].length; x++) {
      sump += arr[y][x].pressure

      if (maxp < Math.abs(arr[y][x].pressure)) {
        maxp = Math.abs(arr[y][x].pressure)
      }

      if (maxx < Math.abs(arr[y][x].velocity.x)) {
        maxx = Math.abs(arr[y][x].velocity.x)
      }

      if (maxy < Math.abs(arr[y][x].velocity.y)) {
        maxy = Math.abs(arr[y][x].velocity.y)
      }
    }
  }

  let valp = (maxp === 0) ? 0 : 255.0 / maxp
  let valx = (maxx === 0) ? 0 : 255.0 / maxx
  let valy = (maxy === 0) ? 0 : 255.0 / maxy

  console.log('MAX:', maxp, maxx, maxy, 'SUM:', sump)

  for (let y = 0; y < row; y++) {
    for (let x = 0; x < col; x++) {
      ctxp.rect(x * 20 + 5, y * 20 + 5, 20, 20)
      ctxv.rect(x * 20 + 5, y * 20 + 5, 20, 20)
    }
  }

  for (let y = 0; y < arr.length; y++) {
    for (let x = 0; x < arr[y].length; x++) {
      ctxv.fillStyle = 'rgb(' + parseInt(255 - valx * Math.abs(arr[y][x].velocity.x)) + ', ' + parseInt(255 - valy * Math.abs(arr[y][x].velocity.y)) + ', 255)'
      ctxv.fillRect(x * 10, y * 10, 10, 10)

      ctxp.fillStyle = 'rgb(' + parseInt(255 - valp * Math.abs(arr[y][x].pressure)) + ', ' + parseInt(255 - valp * Math.abs(arr[y][x].pressure)) + ', 255)'
      ctxp.fillRect(x * 10, y * 10, 10, 10)
    }
  }

  ctxp.stroke()
  ctxv.stroke()
}

function run () {
  curr = zeros(rows, cols) // new values

  for (let i = 1; i < rows; i = i + 2) {
    prev[i][0].velocity.x = 0.00005 // inlet
    prev[i][cols - 2].pressure = 0 // outlet
  }

  tmpv = couple(prev, diverge(prev))
  tmpp = jacobi(prev, diverge(prev))

  for (let i = 1; i < rows; i = i + 2) {
    tmpv[i][0].velocity.x = 0.00005 // inlet
    tmpp[i][cols - 2].pressure = 0 // outlet
  }

  for (let y = 0; y < prev.length; y++) {
    for (let x = 0; x < prev[y].length; x++) {
      if ((y - 2 >= 0 && y + 2 < prev.length && x - 2 >= 0 && x + 2 < prev[y].length)) {
        let p = {
          n: border(prev, { x: x, y: y - 1 }),
          s: border(prev, { x: x, y: y + 1 }),
          e: border(prev, { x: x + 1, y: y }),
          w: border(prev, { x: x - 1, y: y })
        }

        curr[y][x].pressure = prev[y][x].pressure + tmpp[y][x].pressure
        curr[y][x].velocity = {
          x: tmpv[y][x].velocity.x + (p.w.p - p.e.p),
          y: tmpv[y][x].velocity.y + (p.n.p - p.s.p)
        }
      }
    }
  }

  draw(curr)

  for (let y = 0; y < prev.length; y++) {
    for (let x = 0; x < prev[y].length; x++) {
      prev[y][x].pressure = curr[y][x].pressure
      prev[y][x].velocity = {
        x: curr[y][x].velocity.x,
        y: curr[y][x].velocity.y
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', function () {
  setInterval(run, 20)
}, false)
