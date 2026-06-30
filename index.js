// npx vite serve
import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);

// settings
let G = 1;
let SIM_SPEED = 10;
let FREEZE_DISTANCE = 1000;

const BODY1_MASS = 14;
const BODY2_MASS = 10;
const BODY3_MASS = 8;

const BODY1_START_POS = new THREE.Vector3(0, 15, 0);
const BODY2_START_POS = new THREE.Vector3(-18, -10, 0);
const BODY3_START_POS = new THREE.Vector3(18, -10, 0);

const BODY1_START_VEL = new THREE.Vector3(-0.30, 0, 0);
const BODY2_START_VEL = new THREE.Vector3(0.20, 0.30, 0.15);
const BODY3_START_VEL = new THREE.Vector3(0.20, -0.30, 0);

const CAMERA_ZOOM_SPEED = 2.5;
const CAMERA_MIN_DISTANCE = 3;
const CAMERA_MAX_DISTANCE = 500;

const DEFAULTS = {
  G: 1,
  SIM_SPEED: 10,
  FREEZE_DISTANCE: 1000,
  zoomSpeed: 2.5,
  minDistance: 3,
  maxDistance: 500,
  bloom: 2
};

// global settings
const gravityInput = document.getElementById("gravity-input");
const speedInput = document.getElementById("speed-input");
const freezeInput = document.getElementById("freeze-input");

const zoomInput = document.getElementById("zoom-input");
const minZoomInput = document.getElementById("minzoom-input");
const maxZoomInput = document.getElementById("maxzoom-input");

const bloomInput = document.getElementById("bloom-input");

const velocityToggle = document.getElementById("velocity-toggle");
const gravityToggle = document.getElementById("gravity-toggle");
const trailToggle = document.getElementById("trail-toggle");

const resolutionSelect = document.getElementById("resolution-select");

// numbers
gravityInput.addEventListener("input", () => {
  G = clamp(Number(gravityInput.value), 0, 5);
});

speedInput.addEventListener("input", () => {
  SIM_SPEED = clamp(Number(speedInput.value), 0.1, 20);
});

freezeInput.addEventListener("input", () => {
  FREEZE_DISTANCE = clamp(Number(freezeInput.value), 10, 5000);
});

zoomInput.addEventListener("input", () => {
  controls.zoomSpeed = clamp(Number(zoomInput.value), 0.1, 10);
});

minZoomInput.addEventListener("input", () => {
  let min = Number(minZoomInput.value);
  let max = Number(maxZoomInput.value);

  min = clamp(min, 1, 1000);

  if (min >= max) {
    max = min + 10;
    maxZoomInput.value = max;
  }

  controls.minDistance = min;
  controls.maxDistance = max;
});

maxZoomInput.addEventListener("input", () => {
  let min = Number(minZoomInput.value);
  let max = Number(maxZoomInput.value);

  max = clamp(max, 1, 5000);

  if (max <= min) {
    min = max - 10;
    minZoomInput.value = min;
  }

  controls.minDistance = min;
  controls.maxDistance = max;
});

bloomInput.addEventListener("input", () => {
    bloomPass.strength = Number(bloomInput.value);
});

// toggles
let showVelocity = true;
let showGravity = true;
let showTrails = true;
let trailResolution = 4;

velocityToggle.addEventListener("click", () => {

    showVelocity = !showVelocity;

    velocityToggle.textContent = showVelocity ? "ON" : "OFF";
    velocityToggle.className = showVelocity ? "toggle on" : "toggle off";

});

gravityToggle.addEventListener("click", () => {

    showGravity = !showGravity;

    gravityToggle.textContent = showGravity ? "ON" : "OFF";
    gravityToggle.className = showGravity ? "toggle on" : "toggle off";

});

trailToggle.addEventListener("click", () => {

    showTrails = !showTrails;

    trailToggle.textContent = showTrails ? "ON" : "OFF";
    trailToggle.className = showTrails ? "toggle on" : "toggle off";

});

// resolution
resolutionSelect.addEventListener("change", () => {

    const scale = parseInt(resolutionSelect.value) / 100;
    renderer.setPixelRatio(window.devicePixelRatio * scale);

    if (scale >= 1) trailResolution = 1;
    else if (scale >= 0.75) trailResolution = 2;
    else trailResolution = 4;

});

function initUI() {
  velocityToggle.textContent = showVelocity ? "ON" : "OFF";
  velocityToggle.className = showVelocity ? "toggle on" : "toggle off";

  gravityToggle.textContent = showGravity ? "ON" : "OFF";
  gravityToggle.className = showGravity ? "toggle on" : "toggle off";

  trailToggle.textContent = showTrails ? "ON" : "OFF";
  trailToggle.className = showTrails ? "toggle on" : "toggle off";
}

initUI();

// clamp
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// terminal
let terminalHistory = [];
const terminalOutput = document.getElementById("terminal-output");
let terminalInput = "";
let simulationRunning = false;
let simulationPaused = false;

function updateTerminal() {
  terminalOutput.innerHTML = `
> <span style="color: orange">Three-Body</span> <span style="color: red">Simulation</span> v0.1
> Type <span style="color: green">"help"</span> for commands
${colorize(terminalHistory.join("<br>"))}
>> ${colorize(terminalInput)}<span id="cursor"></span>
`;
}

function resetBodies() {
  sunSphere.position.copy(BODY1_START_POS);
  sunSphere2.position.copy(BODY2_START_POS);
  sunSphere3.position.copy(BODY3_START_POS);

  bodies[0].velocity.copy(BODY1_START_VEL);
  bodies[1].velocity.copy(BODY2_START_VEL);
  bodies[2].velocity.copy(BODY3_START_VEL);

  bodies.forEach(body => {
    body.frozen = false;
    body.acceleration.set(0, 0, 0);
  });

  bodies.forEach(body => {
    body.trailPoints = [];
    body.trailGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([], 3)
    );
  });

  updateArrows();
}

function resetSettings() {
  showVelocity = true;
  showGravity = true;
  showTrails = true;

  velocityToggle.textContent = "ON";
  velocityToggle.className = "toggle on";

  gravityToggle.textContent = "ON";
  gravityToggle.className = "toggle on";

  trailToggle.textContent = "ON";
  trailToggle.className = "toggle on";

  G = DEFAULTS.G;
  SIM_SPEED = DEFAULTS.SIM_SPEED;
  FREEZE_DISTANCE = DEFAULTS.FREEZE_DISTANCE;

  controls.zoomSpeed = DEFAULTS.zoomSpeed;
  controls.minDistance = DEFAULTS.minDistance;
  controls.maxDistance = DEFAULTS.maxDistance;

  bloomPass.strength = DEFAULTS.bloom;

  gravityInput.value = G;
  speedInput.value = SIM_SPEED;
  freezeInput.value = FREEZE_DISTANCE;

  zoomInput.value = controls.zoomSpeed;
  minZoomInput.value = controls.minDistance;
  maxZoomInput.value = controls.maxDistance;

  bloomInput.value = bloomPass.strength;
}

window.addEventListener("keydown", (event) => {

  if (
  event.target.tagName === "INPUT" ||
  event.target.tagName === "SELECT" ||
  event.target.tagName === "TEXTAREA"
) {
  return;
}

  if (event.key.length === 1 && terminalInput.length < 35) {
    terminalInput += event.key;
  }

  if (event.key === "Backspace") {
    terminalInput = terminalInput.slice(0, -1);
  }

  if (event.key === "Enter") {
    const command = terminalInput.trim().toLowerCase();

    terminalHistory.push(`> ${terminalInput}`);

    if (command === "help") {
      terminalHistory.push("Commands: run, restart, pause, resume, reset, debug, clear");
    }

    if (command === "clear") {
      terminalHistory = [];
    }

    if (command === "run") {
      if (simulationRunning) {
        terminalHistory.push("Simulation already running.");
      } else {
        simulationRunning = true;
        simulationPaused = false;
        lastTime = performance.now();
        terminalHistory.push("Simulation started.");
      }
    }

    if (command === "restart") {
      resetBodies();
      simulationRunning = true;
      simulationPaused = false;
      lastTime = performance.now();
      terminalHistory.push("Simulation restarted.");
    }

    if (command === "pause") {
      if (!simulationRunning) {
        terminalHistory.push("Simulation is not running.");
      } else if (simulationPaused) {
        terminalHistory.push("Simulation already paused.");
      } else {
        simulationPaused = true;
        terminalHistory.push("Simulation paused.");
      }
    }

    if (command === "resume") {
      if (!simulationRunning) {
        terminalHistory.push("Simulation is not running.");
      } else if (!simulationPaused) {
        terminalHistory.push("Simulation is not paused.");
      } else {
        simulationPaused = false;
        lastTime = performance.now();
        terminalHistory.push("Simulation resumed.");
      }
    }

    if (command === "reset") {
      resetBodies();
      resetSettings();

      simulationRunning = false;
      simulationPaused = false;

      terminalHistory.push("Simulation + settings reset.");
    }

    if (command === "debug") {
      terminalHistory.push(
        `Bodies: ${bodies.length} | Running: ${simulationRunning} | Paused: ${simulationPaused}`
      );
    }

    terminalInput = "";
  }

  updateTerminal();
});

function colorize(text) {
  return text
    .replaceAll(/\bhelp\b/g, '<span style="color: green">help</span>')
    .replaceAll(/\bclear\b/g, '<span style="color: cyan">clear</span>')
    .replaceAll(/\bdebug\b/g, '<span style="color: gold">debug</span>')
    .replaceAll(/\brestart\b/g, '<span style="color: orange">restart</span>')
    .replaceAll(/\bpause\b/g, '<span style="color: mediumorchid">pause</span>')
    .replaceAll(/\brun\b/g, '<span style="color: limegreen">run</span>')
    .replaceAll(/\bresume\b/g, '<span style="color: white">resume</span>')
    .replaceAll(/\breset\b/g, '<span style="color: tomato">reset</span>');
}

updateTerminal();

// UI
const tabs = document.querySelectorAll(".body-tab");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(tab => {
      tab.classList.remove("active");
    });
    tab.classList.add("active");
  });
});

// setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.zoomSpeed = CAMERA_ZOOM_SPEED;
controls.minDistance = CAMERA_MIN_DISTANCE;
controls.maxDistance = CAMERA_MAX_DISTANCE;

const composer = new EffectComposer(renderer);

// 3 bodies
const sunGeometry = new THREE.SphereGeometry(1, 32, 16);

const sunMaterial = new THREE.MeshStandardMaterial({
  color: 0xffdd99,
  emissive: 0xffaa44,
  emissiveIntensity: 2.2
});

const sunMaterial2 = new THREE.MeshStandardMaterial({
  color: 0xffdd88,
  emissive: 0xffaa44,
  emissiveIntensity: 2.0
});

const sunMaterial3 = new THREE.MeshStandardMaterial({
  color: 0xffe8aa,
  emissive: 0xffcc55,
  emissiveIntensity: 1.8
});

const sunSphere = new THREE.Mesh(sunGeometry, sunMaterial);
sunSphere.position.copy(BODY1_START_POS);
scene.add(sunSphere);

const sunSphere2 = new THREE.Mesh(sunGeometry, sunMaterial2);
sunSphere2.position.copy(BODY2_START_POS);
scene.add(sunSphere2);

const sunSphere3 = new THREE.Mesh(sunGeometry, sunMaterial3);
sunSphere3.position.copy(BODY3_START_POS);
scene.add(sunSphere3);

sunSphere.scale.setScalar(BODY1_MASS / 10);
const sun1Mass = BODY1_MASS;
const sun1Vel = BODY1_START_VEL.clone();

sunSphere2.scale.setScalar(BODY2_MASS / 10);
const sun2Mass = BODY2_MASS;
const sun2Vel = BODY2_START_VEL.clone();

sunSphere3.scale.setScalar(BODY3_MASS / 10);
const sun3Mass = BODY3_MASS;
const sun3Vel = BODY3_START_VEL.clone();

const bodies = [
  {
    mesh: sunSphere,
    mass: sun1Mass,
    velocity: sun1Vel,
    acceleration: new THREE.Vector3(),
    frozen: false,

    trailPoints: [],
    trailGeometry: new THREE.BufferGeometry(),
    trail: null
  },
  {
    mesh: sunSphere2,
    mass: sun2Mass,
    velocity: sun2Vel,
    acceleration: new THREE.Vector3(),
    frozen: false,

    trailPoints: [],
    trailGeometry: new THREE.BufferGeometry(),
    trail: null
  },
  {
    mesh: sunSphere3,
    mass: sun3Mass,
    velocity: sun3Vel,
    acceleration: new THREE.Vector3(),
    frozen: false,

    trailPoints: [],
    trailGeometry: new THREE.BufferGeometry(),
    trail: null
  }
];

// trails
const trailColors = [
  0xffdd99,
  0xffdd88,
  0xffe8aa
];

bodies.forEach((body, i) => {

  const material = new THREE.LineBasicMaterial({
    color: trailColors[i]
  });

  body.trail = new THREE.Line(
    body.trailGeometry,
    material
  );

  scene.add(body.trail);

});

// arrow creation
const velArrow = new THREE.ArrowHelper(
  new THREE.Vector3(1, 0, 0),
  sunSphere.position,
  10,
  0x888888,
  1.5,
  1
);

scene.add(velArrow);

const gravityArrow = new THREE.ArrowHelper(
  new THREE.Vector3(0, -1, 0),
  sunSphere.position,
  7,
  0x888888,
  1,
  1
);

scene.add(gravityArrow);

const velArrow2 = new THREE.ArrowHelper(
  new THREE.Vector3(1, 0, 0),
  sunSphere2.position,
  10,
  0x888888,
  1.5,
  1
);

scene.add(velArrow2);

const gravityArrow2 = new THREE.ArrowHelper(
  new THREE.Vector3(0, -1, 0),
  sunSphere2.position,
  7,
  0x888888,
  1,
  1
);

scene.add(gravityArrow2);

const velArrow3 = new THREE.ArrowHelper(
  new THREE.Vector3(1, 0, 0),
  sunSphere3.position,
  10,
  0x888888,
  1.5,
  1
);

scene.add(velArrow3);

const gravityArrow3 = new THREE.ArrowHelper(
  new THREE.Vector3(0, -1, 0),
  sunSphere3.position,
  7,
  0x888888,
  1,
  1
);

scene.add(gravityArrow3);

function updateArrows() {
  velArrow.position.copy(bodies[0].mesh.position);
  velArrow.setDirection(bodies[0].velocity.clone().normalize());

  gravityArrow.position.copy(bodies[0].mesh.position);
  gravityArrow.setDirection(bodies[0].acceleration.clone().normalize());

  velArrow2.position.copy(bodies[1].mesh.position);
  velArrow2.setDirection(bodies[1].velocity.clone().normalize());

  gravityArrow2.position.copy(bodies[1].mesh.position);
  gravityArrow2.setDirection(bodies[1].acceleration.clone().normalize());

  velArrow3.position.copy(bodies[2].mesh.position);
  velArrow3.setDirection(bodies[2].velocity.clone().normalize());

  gravityArrow3.position.copy(bodies[2].mesh.position);
  gravityArrow3.setDirection(bodies[2].acceleration.clone().normalize());
}

// corona
const coronaGeometry = new THREE.SphereGeometry(1.25, 32, 16);

const coronaMaterial = new THREE.MeshBasicMaterial({
  color: 0xffcc44,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
sunSphere.add(corona);

const corona2 = corona.clone();
sunSphere2.add(corona2);

const corona3 = corona.clone();
sunSphere3.add(corona3);

// stars
const clusters = [];

for (let i = 0; i < 5; i++) {
  clusters.push({
    x: (Math.random() - 0.5) * 4000,
    y: (Math.random() - 0.5) * 4000,
    z: (Math.random() - 0.5) * 4000,
    radius: 800 + Math.random() * 800
  });
}

function createStars(count, size) {
  const positions = [];
  const colors = [];

  for (let i = 0; i < count; i++) {
    let x, y, z;

    if (Math.random() < 0.15) {
      const cluster = clusters[Math.floor(Math.random() * clusters.length)];
      x = cluster.x + (Math.random() - Math.random()) * cluster.radius;
      y = cluster.y + (Math.random() - Math.random()) * cluster.radius;
      z = cluster.z + (Math.random() - Math.random()) * cluster.radius;
    } else {
      const radius = 1500 + Math.random() * 1000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      x = radius * Math.sin(phi) * Math.cos(theta);
      y = radius * Math.sin(phi) * Math.sin(theta);
      z = radius * Math.cos(phi);
    }

    positions.push(x, y, z);

    const brightness = 0.2 + Math.pow(Math.random(), 0.3) * 0.8;
    const r = brightness;
    const g = brightness * (0.85 + Math.random() * 0.15);
    const b = brightness * (0.7 + Math.random() * 0.3);

    colors.push(r, g, b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    sizeAttenuation: false
  });

  return new THREE.Points(geometry, material);
}

scene.add(createStars(4000, 1));
scene.add(createStars(800, 3));
scene.add(createStars(100, 6));

// camera
camera.position.set(0, 0, 65);
controls.target.set(0, 0, 0);
controls.update();

const renderScene = new RenderPass(scene, camera);
composer.addPass(renderScene);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  2.0,
  0.8,
  0.15
);

composer.addPass(bloomPass);

let lastTime = 0;
let firstFrame = true;
let trailFrame = 0;

// animation
function animate(time) {
  if (!simulationRunning) {
    composer.render();
    return;
  }

  if (simulationPaused) {
    composer.render();
    return;
  }

  if (firstFrame) {
    lastTime = time;
    trailFrame++;
    firstFrame = false;
    return;
  }

  const dt = ((time - lastTime) / 1000) * SIM_SPEED;
  lastTime = time;
  trailFrame++;

  controls.update();

  for (const A of bodies) {
    if (A.frozen) continue;

    const totalForce = new THREE.Vector3();

    for (const B of bodies) {
      if (B.frozen) continue;
      if (A === B) continue;

      const direction = new THREE.Vector3().subVectors(B.mesh.position, A.mesh.position);
      const distance = Math.max(direction.length(), 2);
      direction.normalize();

      const forceStrength = (G * A.mass * B.mass) / (distance * distance);
      totalForce.add(direction.multiplyScalar(forceStrength));
    }

    A.acceleration.copy(totalForce.divideScalar(A.mass));
  }

  for (const A of bodies) {
    if (A.frozen) continue;
    A.velocity.add(A.acceleration.clone().multiplyScalar(dt));
    A.mesh.position.add(A.velocity.clone().multiplyScalar(dt));

    if (A.mesh.position.length() > FREEZE_DISTANCE) {
      A.frozen = true;
    }
  }

  if (showTrails && trailFrame % trailResolution === 0) {

    for (const body of bodies) {

        body.trailPoints.push(
            body.mesh.position.x,
            body.mesh.position.y,
            body.mesh.position.z
        );

        body.trailGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(body.trailPoints, 3)
        );

        body.trailGeometry.computeBoundingSphere();
    }

  }

  updateArrows();
  velArrow.visible = showVelocity;
  velArrow2.visible = showVelocity;
  velArrow3.visible = showVelocity;

  gravityArrow.visible = showGravity;
  gravityArrow2.visible = showGravity;
  gravityArrow3.visible = showGravity;

  bodies.forEach(body => {
    body.trail.visible = showTrails;
  });

  corona.rotation.y += 0.001;
  corona2.rotation.y += 0.001;
  corona3.rotation.y += 0.001;

  const pulse = 1 + Math.sin(time * 0.001) * 0.02 + Math.sin(time * 0.0023) * 0.01;
  corona.scale.setScalar(pulse);
  corona2.scale.setScalar(pulse);
  corona3.scale.setScalar(pulse);

  composer.render();
}
