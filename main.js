"use strict";
const m4 = twgl.m4;
twgl.setDefaults({attribPrefix: "a_"});
const gl = document.getElementById("c").getContext("webgl");
const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

const textures = twgl.createTextures(gl, {
  emoji: {
    src: "img/sheet_apple_32_2048.png",
    min: gl.NEAREST_MIPMAP_NEAREST,
  }
});

const numItems = 50000;
const emojiDim = 49;
const state = {
  aspect: 1.0,
  velocity: twgl.primitives.createAugmentedTypedArray(2, numItems),
}
const arrays = {
  position: twgl.primitives.createAugmentedTypedArray(3, numItems),
  info: twgl.primitives.createAugmentedTypedArray(3, numItems, Uint8Array),
};

function rand(min, max) {
  return min + Math.random() * (max - min);
}

const uniforms = {
  u_matrix: m4.identity(),
  u_emoji: textures.emoji,
  u_emojiScale: window.devicePixelRatio,
};

function initialize(state, arrays) {
  const velocity = state.velocity;
  const position = arrays.position;
  for (let i = 0; i < numItems*3; i += 3) {
    position[i] = rand(0,state.aspect);
    position[i+1] = rand(0,0.5);
    position[i+2] = i/numItems;
    velocity[i] = rand(-0.005,0.005);
    velocity[i+1] = rand(-0.005,0.005);
  }

  const info = arrays.info;
  for (let i = 0; i < numItems*3; i += 3) {
    info[i] = rand(0,emojiDim);
    info[i+1] = rand(0,emojiDim);
    info[i+2] = rand(8.0,16.0);
  }
  console.log(info)
}

function update(state, arrays) {
  const gravity = 0.001;
  const velocity = state.velocity;
  const position = arrays.position;
  for (let i = 0; i < numItems*3; i += 3) {
    position[i] += velocity[i];
    position[i+1] += velocity[i+1];

    // velocity[i+1] -= gravity;

    if(position[i] < 0) {
      velocity[i] = Math.abs(velocity[i]);
    }
    if(position[i] > state.aspect) {
      velocity[i] = -Math.abs(velocity[i]);
    }
    if(position[i+1] < 0) {
      velocity[i+1] = Math.abs(velocity[i+1]);
    }
    if(position[i+1] > 1.0) {
      velocity[i+1] = -Math.abs(velocity[i+1]);
    }
  }
}

function render(time) {
  time *= 0.001;

  twgl.resizeCanvasToDisplaySize(gl.canvas, window.devicePixelRatio);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  state.aspect = aspect;
  uniforms.u_emojiScale = window.devicePixelRatio;

  update(state, arrays);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

  gl.enable(gl.DEPTH_TEST);
  // gl.enable(gl.CULL_FACE);
  gl.clearColor(1,1,1,1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  m4.ortho(0, aspect, 0, 1, -1, 10000000, uniforms.u_matrix);

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, uniforms);

  twgl.drawBufferInfo(gl, bufferInfo, gl.POINTS);

  requestAnimationFrame(render);
}

initialize(state, arrays);
requestAnimationFrame(render);
