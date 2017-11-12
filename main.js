"use strict";
const m4 = twgl.m4;
twgl.setDefaults({attribPrefix: "a_"});
const gl = document.getElementById("c").getContext("webgl");
const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

const numItems = 1000;
const state = {
  velocity: twgl.primitives.createAugmentedTypedArray(2, numItems),
}
const arrays = {
  position: twgl.primitives.createAugmentedTypedArray(2, numItems),
};

function rand(min, max) {
  return min + Math.random() * (max - min);
}

const uniforms = {
  u_matrix: m4.identity(),
};

function initialize(state, arrays) {
  const velocity = state.velocity;
  const position = arrays.position;
  for (let i = 0; i < numItems*2; i += 2) {
    position[i] = rand(-0.5,0.5);
    position[i+1] = rand(-0.5,0.5);
    velocity[i] = rand(-0.005,0.005);
    velocity[i+1] = rand(-0.005,0.005);
  }
}

function update(state, arrays) {
  const gravity = 0.001;
  const velocity = state.velocity;
  const position = arrays.position;
  for (let i = 0; i < numItems*2; i += 2) {
    position[i] += velocity[i];
    position[i+1] += velocity[i+1];

    velocity[i+1] -= gravity;

    if(position[i] < -1.0) {
      position[i] = -1.0;
      velocity[i] = -velocity[i];
    }
    if(position[i] > 1.0) {
      position[i] = 1.0;
      velocity[i] = -velocity[i];
    }
    if(position[i+1] < -1.0) {
      position[i+1] = -1.0;
      velocity[i+1] = -velocity[i+1];
    }
    if(position[i+1] > 1.0) {
      position[i+1] = 1.0;
      velocity[i+1] = -velocity[i+1];
    }
  }
}

function render(time) {
  time *= 0.001;

  update(state, arrays);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clearColor(1,1,1,1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  m4.ortho(-aspect, aspect, 1, -1, -1, 1, uniforms.u_matrix);

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, uniforms);

  twgl.drawBufferInfo(gl, bufferInfo, gl.POINTS);

  requestAnimationFrame(render);
}

initialize(state, arrays);
requestAnimationFrame(render);
