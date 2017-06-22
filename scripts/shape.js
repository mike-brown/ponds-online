'use strict'

const row = 25
const col = 25

const rows = 2 * row + 1
const cols = 2 * col + 1

var curr = zeros(rows, cols) // new values
var prev = zeros(rows, cols) // old values
var temp = zeros(rows, cols) // advect values

const time = 1.0 // 1s interval
const size = 1.0 // 1m cell
const density = 1000.0 // 1000kg/m^3

// prev[0][0].velocity.x = 0.1
// prev[0][0].velocity.y = 0.1
//
// prev[0][1].velocity.x = 0.3
// prev[0][1].velocity.y = 0.3
//
// prev[1][0].velocity.x = 0.5
// prev[1][0].velocity.y = 0.5
//

function zeros (rows, cols) {
  let grid = []
  for (let x = 0; x < rows; x++) {
    let line = []
    for (let y = 0; y < cols; y++) {
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

function advect (prev) {
  let arr = zeros(rows, cols)

  for (let x = 0; x < prev.length; x++) {
    for (let y = 0; y < prev[x].length; y++) {
      let ox = x - prev[x][y].velocity.x * time
      let oy = y - prev[x][y].velocity.y * time

      let q11 = {
        x: parseInt(Math.floor(ox)),
        y: parseInt(Math.floor(oy))
      }

      let q12 = {
        x: parseInt(Math.floor(ox)),
        y: parseInt(Math.floor(oy)) + 1
      }

      let q21 = {
        x: parseInt(Math.floor(ox)) + 1,
        y: parseInt(Math.floor(oy))
      }

      let q22 = {
        x: parseInt(Math.floor(ox)) + 1,
        y: parseInt(Math.floor(oy)) + 1
      }

      arr[x][y] = bilinear(prev, ox, oy, q11, q12, q21, q22)
    }
  }
  return arr
}

function bilinear (arr, x, y, q11, q12, q21, q22) {
  const d = {
    x: x,
    y: y,
    x1: q11.x,
    y1: q11.y,
    x2: q22.x,
    y2: q22.y,

    v11: border(arr, q11),
    v12: border(arr, q12),
    v21: border(arr, q21),
    v22: border(arr, q22)
  }

  let term = 1 / (d.x2 - d.x1) * (d.y2 - d.y1)

  // performs x-axis velocity computation of interpolation
  let vx = (((d.x2 - d.x) * d.v11.x) + ((d.x - d.x1) * d.v21.x)) * (d.y2 - d.y) +
           (((d.x2 - d.x) * d.v12.x) + ((d.x - d.x1) * d.v22.x)) * (d.y - d.y1)

  // performs y-axis velocity computation of interpolation
  let vy = (((d.x2 - d.x) * d.v11.y) + ((d.x - d.x1) * d.v21.y)) * (d.y2 - d.y) +
           (((d.x2 - d.x) * d.v12.y) + ((d.x - d.x1) * d.v22.y)) * (d.y - d.y1)

  return {
    pressure: 0,
    velocity: {
      x: term * vx,
      y: term * vy
    }
  }
}

function border (arr, q) {
  let v = {
    p: 0,
    x: 0,
    y: 0
  }

  if (q.x >= 0 && q.x < arr.length && q.y >= 0 && q.y < arr[q.x].length) {
    v = {
      p: arr[q.x][q.y].pressure,
      x: arr[q.x][q.y].velocity.x,
      y: arr[q.x][q.y].velocity.y
    }
  }

  // outlet
  if (q.x === 25 && q.y === 1) {
    v.p = -1000
  }

  return v
}

function diverge (temp) {
  let grid = []
  for (let x = 0; x < temp.length; x++) {
    let line = []
    for (let y = 0; y < temp[x].length; y++) {
      // if not active, ignore

      let v = {
        n: border(temp, { x: x - 1, y: y }),
        e: border(temp, { x: x, y: y - 1 }),
        s: border(temp, { x: x + 1, y: y }),
        w: border(temp, { x: x, y: y + 1 })
      }

      let term = (-2 * size * density) / time

      line.push(term * (v.e.x - v.w.x + v.s.y - v.n.y)) // inverted x and y for axes
    }
    grid.push(line)
  }

  return grid
}

function jacobi (curr, prev, dvrg) {
  let arr = zeros(rows, cols)
  for (let x = 0; x < prev.length; x++) {
    for (let y = 0; y < prev[0].length; y++) {
      // if not active, ignore

      let p = {
        n: border(prev, { x: x - 2, y: y }),
        e: border(prev, { x: x, y: y - 2 }),
        s: border(prev, { x: x + 2, y: y }),
        w: border(prev, { x: x, y: y + 2 })
      }

      let term = (dvrg[x][y] + p.e.p + p.w.p + p.s.p + p.n.p) / 4
      arr[x][y].pressure = term

      arr[x][y].velocity = {
        x: curr[x][y].velocity.x,
        y: curr[x][y].velocity.y
      }
    }
  }
  return arr
}

function gradient (curr, prev) {
  let arr = zeros(rows, cols)
  for (let x = 0; x < prev.length; x++) {
    for (let y = 0; y < prev[x].length; y++) {
      // make current velocity using current pressure and past velocity

      // doesn't calculate if velocity cells aren't against a wall, unless designated as inlet or outlet
      if ((x - 2 >= 0 && x + 2 < arr.length && y - 2 >= 0 && y + 2 < arr[0].length) || (x === 25 && y === 0) || ((x === 23 || x === 25 || x === 27) && y === cols - 1)) {
        let p = {
          n: border(curr, { x: x - 1, y: y }), // velocity in negative x-axis (north)
          e: border(curr, { x: x, y: y - 1 }), // velocity in negative y-axis (east)
          s: border(curr, { x: x + 1, y: y }), // velocity in positive x-axis (south)
          w: border(curr, { x: x, y: y + 1 }) // velocity in positive y-axis (west)
        }

        let term = (time / (2 * size * density))

        arr[x][y].velocity = {
          x: prev[x][y].velocity.x - term * (p.e.p - p.w.p),
          y: prev[x][y].velocity.y - term * (p.s.p - p.n.p)
        }
      }

      arr[x][y].pressure = curr[x][y].pressure
    }
  }
  return arr
}

function draw (arr) {
  let ctxp = document.getElementById('pcanvas').getContext('2d')
  let ctxv = document.getElementById('vcanvas').getContext('2d')

  ctxp.clearRect(0, 0, ctxp.canvas.width, ctxp.canvas.height)
  ctxv.clearRect(0, 0, ctxv.canvas.width, ctxv.canvas.height)

  let maxp = 0
  let maxx = 0
  let maxy = 0

  for (let x = 0; x < arr.length; x++) {
    for (let y = 0; y < arr[0].length; y++) {
      if (maxp < Math.abs(arr[x][y].pressure)) {
        maxp = Math.abs(arr[x][y].pressure)
      }

      if (maxx < Math.abs(arr[x][y].velocity.x)) {
        maxx = Math.abs(arr[x][y].velocity.x)
      }

      if (maxy < Math.abs(arr[x][y].velocity.y)) {
        maxy = Math.abs(arr[x][y].velocity.y)
      }
    }
  }

  let valp = 255.0 / maxp
  let valx = 255.0 / maxx
  let valy = 255.0 / maxy

  for (let x = 0; x < row; x++) {
    for (let y = 0; y < col; y++) {
      ctxp.rect(x * 20 + 5, y * 20 + 5, 20, 20)
      ctxv.rect(x * 20 + 5, y * 20 + 5, 20, 20)
    }
  }

  for (let x = 0; x < arr.length; x++) {
    for (let y = 0; y < arr[x].length; y++) {
      ctxv.fillStyle = 'rgb(' + parseInt(255 - valx * Math.abs(arr[x][y].velocity.x)) + ', ' + parseInt(255 - valy * Math.abs(arr[x][y].velocity.y)) + ', 255)'
      ctxv.fillRect(x * 10, y * 10, 10, 10)

      ctxp.fillStyle = 'rgb(' + parseInt(255 - valp * Math.abs(arr[x][y].pressure)) + ', ' + parseInt(255 - valp * Math.abs(arr[x][y].pressure)) + ', 255)'
      ctxp.fillRect(x * 10, y * 10, 10, 10)

      if (arr[x][y].velocity.x > 0) {
        ctxv.beginPath()
        ctxv.moveTo(x * 10, y * 10 + 10)
        ctxv.lineTo(x * 10 + 5, y * 10)
        ctxv.lineTo(x * 10 + 10, y * 10 + 10)
        ctxv.closePath()
        ctxv.stroke()
      }

      if (arr[x][y].velocity.x < 0) {
        ctxv.beginPath()
        ctxv.moveTo(x * 10, y * 10)
        ctxv.lineTo(x * 10 + 5, y * 10 + 10)
        ctxv.lineTo(x * 10 + 10, y * 10)
        ctxv.closePath()
        ctxv.stroke()
      }

      if (arr[x][y].velocity.y > 0) {
        ctxv.beginPath()
        ctxv.moveTo(x * 10 + 10, y * 10)
        ctxv.lineTo(x * 10, y * 10 + 5)
        ctxv.lineTo(x * 10 + 10, y * 10 + 10)
        ctxv.closePath()
        ctxv.stroke()
      }

      if (arr[x][y].velocity.y < 0) {
        ctxv.beginPath()
        ctxv.moveTo(x * 10, y * 10)
        ctxv.lineTo(x * 10 + 10, y * 10 + 5)
        ctxv.lineTo(x * 10, y * 10 + 10)
        ctxv.closePath()
        ctxv.stroke()
      }
    }
  }

  ctxp.stroke()
  ctxv.stroke()
}

function run () {
  curr = zeros(rows, cols) // new values

  temp = advect(prev)

  // inlet
  temp[23][cols - 1].velocity.x = -1.0
  temp[25][cols - 1].velocity.x = -1.0
  temp[27][cols - 1].velocity.x = -1.0

  curr = gradient(jacobi(curr, prev, diverge(temp)), prev)
  draw(curr)

  for (let x = 0; x < prev.length; x++) {
    for (let y = 0; y < prev[x].length; y++) {
      prev[x][y].pressure = curr[x][y].pressure
      prev[x][y].velocity = {
        x: curr[x][y].velocity.x,
        y: curr[x][y].velocity.y
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', function () {
  setInterval(run, 20)
}, false)
