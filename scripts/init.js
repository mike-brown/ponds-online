/* global GL:false */
'use strict'

document.addEventListener('DOMContentLoaded', () => {
  const $canvases = document.querySelector('.canvases')
  const $designCanvas = $canvases.querySelector('canvas.design')
  const $run = document.querySelector('button.run')

  $designCanvas.height = $designCanvas.clientHeight
  $designCanvas.width = $designCanvas.clientWidth

  const dctx = $designCanvas.getContext('2d')

  let simulating = false
  let tool = 'water'

  dctx.fillStyle = 'red'
  dctx.fillRect(100, 100, 200, 200)

  const startSim = () => {
    $run.classList.remove('primary')
    $run.classList.add('secondary')
    $run.textContent = 'Stop Simulation'
    document.querySelector('.title').textContent = 'Simulation'

    let angle = 0
    const gl = GL.create()
    const mesh = GL.Mesh.cube()
    const shader = new GL.Shader(`
        void main() {
        gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
      }
    `, `
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `)

    gl.onupdate = seconds => {
      angle += 45 * seconds
    }

    gl.ondraw = () => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.loadIdentity()
      gl.translate(0, 0, -5)
      gl.rotate(30, 1, 0, 0)
      gl.rotate(angle, 0, 1, 0)

      shader.draw(mesh)
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    gl.matrixMode(gl.PROJECTION)
    gl.loadIdentity()
    gl.perspective(45, gl.canvas.width / gl.canvas.height,
      0.1, 1000)
    gl.matrixMode(gl.MODELVIEW)

    gl.animate()

    const $simulationCanvas = gl.canvas
    $simulationCanvas.height = $designCanvas.height
    $simulationCanvas.width = $designCanvas.width
    $simulationCanvas.classList.add('simulation')
    $canvases.appendChild($simulationCanvas)

    $designCanvas.style.display = 'none'
  }

  const stopSim = () => {
    $run.classList.remove('secondary')
    $run.classList.add('primary')
    $run.textContent = 'Run Simulation'
    document.querySelector('.title').textContent = 'Design'
  }

  $run.addEventListener('click', () => {
    if (!simulating) {
      startSim()
    } else {
      stopSim()
    }

    simulating = !simulating
  })
})
