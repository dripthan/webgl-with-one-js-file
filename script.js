
// --------------------------------------------------------------------- shaders

const vsSource = `#version 300 es

precision highp float;

layout(location = 0) in vec2 vPosition;
layout(location = 1) in float vSize;

uniform float uCanvasWidth;
uniform float uCanvasHeight;

void main()
{
  float x = (vPosition.x / uCanvasWidth - 0.5) * 2.f;
  float y = -(vPosition.y / uCanvasHeight - 0.5) * 2.f;
  gl_Position = vec4(x, y, 0.f, 1.f);
  gl_PointSize = vSize;
}

`;

const fsSource = `#version 300 es

precision highp float;

out vec4 finalColor;

void main()
{
  finalColor = vec4(1.f, 1.f, 1.f, 0.1f);
}

`;

// --------------------------------------------------------------------- global variables

const MAX_PARTICLES = 1000000;
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');
const mouse = {
  x: 0,
  y: 0,
  down: false
};

// --------------------------------------------------------------------- particle variables

const positionsArray = new Float32Array(MAX_PARTICLES * 2);
const sizesArray = new Float32Array(MAX_PARTICLES);
let parts = [];

// --------------------------------------------------------------------- shader

const program = gl.createProgram();
let shader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(shader, vsSource);
gl.compileShader(shader);
if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.log(gl.getShaderInfoLog(shader));
gl.attachShader(program, shader);
gl.deleteShader(shader);
shader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(shader, fsSource);
gl.compileShader(shader);
if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.log(gl.getShaderInfoLog(shader));
gl.attachShader(program, shader);
gl.deleteShader(shader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.log(gl.getProgramInfoLog(program));

// --------------------------------------------------------------------- model buffers

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(0, 1);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const sizeBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(1, 1);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

gl.bindVertexArray(null);

// --------------------------------------------------------------------- loop

gl.clearColor(0.0, 0.0, 0.0, 1.0);

const loop = () => {

  // ------------------------------------------------------------------- particles

  if (mouse.down) {
    for (let i = 0; i < 500; i += 1) {
      parts.push({
        x: mouse.x,
        y: mouse.y,
        r: 15,
        d: Math.random() * Math.PI * 2,
        m: 5,
        rr: -0.1 * Math.random() - 0.1,
        dd: 0.01 * Math.random(),
        mm: -0.1 * Math.random(),
      });
    }
  }

  for (let i = parts.length - 1; i >= 0; --i) {
    const p = parts[i];
    p.x += p.m * Math.cos(p.d);
    p.y += p.m * Math.sin(p.d);
    p.r += p.rr;
    p.d += p.dd;
    p.m += p.mm;
  }

  parts = parts.filter(({x, y, r}) => (
    x > 0 &&
    y > 0 &&
    x < canvas.width &&
    y < canvas.height &&
    r > 0
  ));

  // ------------------------------------------------------------------- upload vbo data

  for (let i = 0; i < parts.length; i++) {
    positionsArray[i * 2] = parts[i].x;
    positionsArray[i * 2 + 1] = parts[i].y;
  }
  for (let i = 0; i < parts.length; i++) {
    sizesArray[i] = parts[i].r;
  }

  // ------------------------------------------------------------------- clear screen

  gl.clear(gl.COLOR_BUFFER_BIT);

  // ------------------------------------------------------------------- rendering

  gl.useProgram(program);

  gl.uniform1f(gl.getUniformLocation(program, 'uCanvasWidth'), canvas.width);
  gl.uniform1f(gl.getUniformLocation(program, 'uCanvasHeight'), canvas.height);

  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(0);
  gl.enableVertexAttribArray(1);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positionsArray, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sizesArray, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.drawArraysInstanced(gl.POINTS, 0, 1, parts.length);

  gl.disableVertexAttribArray(1);
  gl.disableVertexAttribArray(0);
  gl.bindVertexArray(null);
  gl.useProgram(null);

  requestAnimationFrame(loop);
};

// ------------------------------------------------------------------- events

addEventListener('load', () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  requestAnimationFrame(loop);
});

addEventListener('resize', () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
});

addEventListener('mousemove', ({x, y}) => {
  mouse.x = x;
  mouse.y = y;
});

addEventListener('mousedown', () => mouse.down = true);
addEventListener('mouseup', () => mouse.down = false);