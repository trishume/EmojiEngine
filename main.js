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

const numItems = 80000;
const emojiDim = 49;
const state = {
  aspect: 1.0,
  mouseX: 0,
  mouseY: 0,
  altKey: false,
  mouseButtons: 0,
  gravity: false,
  friction: false,
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

// Credit to https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

function initialize_data(state, arrays) {
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
    info[i+2] = Math.max(8.0,randn_bm()*4.0 + 12.0);
  }
  console.log(info)
}

function update(state, arrays) {
  const gravity = 0.0001;
  const friction = 0.99;
  const velocity = state.velocity;
  const position = arrays.position;
  for (let i = 0; i < numItems*3; i += 3) {
    position[i] += velocity[i];
    position[i+1] += velocity[i+1];

    if(state.gravity) velocity[i+1] -= gravity;
    if(state.friction) {
      velocity[i] *= friction;
      velocity[i+1] *= friction;
    }

    if(state.mouseButtons == 0 || state.altKey) {
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

  if(state.mouseButtons > 0) {
    var factor = 0.0005;
    if(state.altKey) {
      factor *= -1;
    }
    for (let i = 0; i < numItems*3; i += 3) {
      const dx = state.mouseX - position[i];
      const dy = state.mouseY - position[i+1];
      const dist2 = dx*dx + dy*dy;
      velocity[i] += factor*(dx/dist2)
      velocity[i+1] += factor*(dy/dist2)
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

function mouse(event) {
  const scale = gl.canvas.height / window.devicePixelRatio;
  state.mouseX = event.clientX / scale;
  state.mouseY = 1 - (event.clientY / scale);
  state.mouseButtons = event.buttons;
  state.altKey = event.altKey;
}

function key(event) {
  if(event.charCode == 'f'.charCodeAt(0)) {
    state.friction = !state.friction;
  }
  if(event.charCode == 'g'.charCodeAt(0)) {
    state.gravity = !state.gravity;
  }
}

function init() {
  initialize_data(state, arrays);
  requestAnimationFrame(render);

  document.addEventListener('mousemove', mouse);
  document.addEventListener('mousedown', mouse);
  document.addEventListener('mouseup', mouse);
  document.addEventListener('keypress', key);
}

window.onload = init;
