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

function advect (prev) {
  let arr = zeros(rows, cols)

  for (let y = 0; y < prev.length; y++) {
    for (let x = 0; x < prev[y].length; x++) {
      let ox = x - prev[y][x].velocity.x * time
      let oy = y - prev[y][x].velocity.y * time

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

      arr[y][x] = bilinear(prev, ox, oy, q11, q12, q21, q22)
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
      p: arr[q.y][q.x].pressure,
      x: arr[q.y][q.x].velocity.x,
      y: arr[q.y][q.x].velocity.y
    }
  }

  // outlet
  if (q.y === 25 && q.x === 1) {
    v.p = -3000
  }

  return v
}

function diverge (temp) {
  let grid = []
  for (let y = 0; y < temp.length; y++) {
    let line = []
    for (let x = 0; x < temp[y].length; x++) {
      // if not active, ignore

      let v = {
        n: border(temp, { x: x, y: y - 1 }),
        e: border(temp, { x: x + 1, y: y }),
        s: border(temp, { x: x, y: y + 1 }),
        w: border(temp, { x: x - 1, y: y })
      }

      let term = (-2 * size * density) / time

      line.push(term * (v.e.x - v.w.x + v.s.y - v.n.y))
    }
    grid.push(line)
  }

  return grid
}

function jacobi (curr, prev, dvrg) {
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

      let term = (dvrg[y][x] + p.e.p + p.w.p + p.s.p + p.n.p) / 4
      arr[y][x].pressure = term

      arr[y][x].velocity = {
        x: curr[y][x].velocity.x,
        y: curr[y][x].velocity.y
      }
    }
  }
  return arr
}

function gradient (curr, prev) {
  let arr = zeros(rows, cols)
  for (let y = 0; y < prev.length; y++) {
    for (let x = 0; x < prev[y].length; x++) {
      // make current velocity using current pressure and past velocity

      // doesn't calculate if velocity cells aren't against a wall, unless designated as inlet or outlet
      if ((x - 2 >= 0 && x + 2 < arr.length && y - 2 >= 0 && y + 2 < arr[0].length)) {
        let p = {
          n: border(curr, { x: x, y: y - 1 }),
          e: border(curr, { x: x + 1, y: y }),
          s: border(curr, { x: x, y: y + 1 }),
          w: border(curr, { x: x - 1, y: y })
        }

        let term = (time / (2 * size * density))

        arr[y][x].velocity = {
          x: prev[y][x].velocity.x - term * (p.e.p - p.w.p),
          y: prev[y][x].velocity.y - term * (p.s.p - p.n.p)
        }
      }

      arr[y][x].pressure = curr[y][x].pressure
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

  let sump = 0

  for (let y = 0; y < arr.length; y++) {
    for (let x = 0; x < arr[y].length; x++) {
      sump += Math.abs(arr[y][x].pressure)

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

  let valp = 255.0 / maxp
  let valx = 255.0 / maxx
  let valy = 255.0 / maxy

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

      if (arr[y][x].pressure > 0) {
        ctxp.beginPath()
        ctxp.moveTo(x * 10, y * 10 + 10)
        ctxp.lineTo(x * 10 + 5, y * 10)
        ctxp.lineTo(x * 10 + 10, y * 10 + 10)
        ctxp.closePath()
        ctxp.stroke()
      }

      if (arr[y][x].pressure < 0) {
        ctxp.beginPath()
        ctxp.moveTo(x * 10, y * 10)
        ctxp.lineTo(x * 10 + 5, y * 10 + 10)
        ctxp.lineTo(x * 10 + 10, y * 10)
        ctxp.closePath()
        ctxp.stroke()
      }

      if (arr[y][x].velocity.y < 0) {
        ctxv.beginPath()
        ctxv.moveTo(x * 10, y * 10 + 10)
        ctxv.lineTo(x * 10 + 5, y * 10)
        ctxv.lineTo(x * 10 + 10, y * 10 + 10)
        ctxv.closePath()
        ctxv.stroke()
      }

      if (arr[y][x].velocity.y > 0) {
        ctxv.beginPath()
        ctxv.moveTo(x * 10, y * 10)
        ctxv.lineTo(x * 10 + 5, y * 10 + 10)
        ctxv.lineTo(x * 10 + 10, y * 10)
        ctxv.closePath()
        ctxv.stroke()
      }

      if (arr[y][x].velocity.x < 0) {
        ctxv.beginPath()
        ctxv.moveTo(x * 10 + 10, y * 10)
        ctxv.lineTo(x * 10, y * 10 + 5)
        ctxv.lineTo(x * 10 + 10, y * 10 + 10)
        ctxv.closePath()
        ctxv.stroke()
      }

      if (arr[y][x].velocity.x > 0) {
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
  temp[23][cols - 1].velocity.x = -0.1
  temp[25][cols - 1].velocity.x = -0.1
  temp[27][cols - 1].velocity.x = -0.1

  curr = gradient(jacobi(curr, prev, diverge(temp)), prev)
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
  setInterval(run, 50)
}, false)
