// npx vite serve

// import
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
const G = 1
const SIM_SPEED = 1;

const FREEZE_DISTANCE = 1000;

const BODY1_MASS = 14;
const BODY2_MASS = 10;
const BODY3_MASS = 8;

const BODY1_START_POS = new THREE.Vector3(0, 15, 0);
const BODY2_START_POS = new THREE.Vector3(-18, -10, 0);
const BODY3_START_POS = new THREE.Vector3(18, -10, 0);

const BODY1_START_VEL = new THREE.Vector3(-0.30, 0, 0);
const BODY2_START_VEL = new THREE.Vector3(0.20, 0.30, 0);
const BODY3_START_VEL = new THREE.Vector3(0.20, -0.30, 0);

// setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );
const controls = new OrbitControls( camera, renderer.domElement );
controls.zoomSpeed = 2.5;
controls.minDistance = 3;
controls.maxDistance = 500;
const composer = new EffectComposer(renderer);

// 3 bodies
const sunGeometry = new THREE.SphereGeometry( 1, 32, 16 );
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

sunSphere.scale.setScalar(1.4);
const sun1Mass = sunSphere.scale.x * 10;
const sun1Vel = new THREE.Vector3(-0.30, 0, 0);

sunSphere2.scale.setScalar(1.0);
const sun2Mass = sunSphere2.scale.x * 10;
const sun2Vel = new THREE.Vector3(0.20, 0.30, 0);

sunSphere3.scale.setScalar(0.8);
const sun3Mass = sunSphere3.scale.x * 10;
const sun3Vel = new THREE.Vector3(0.20, -0.30, 0);

const bodies = [
  {
    mesh: sunSphere,
    mass: sun1Mass,
    velocity: sun1Vel,
    acceleration: new THREE.Vector3(),
    frozen: false
  },

  {
    mesh: sunSphere2,
    mass: sun2Mass,
    velocity: sun2Vel,
    acceleration: new THREE.Vector3(),
    frozen: false
  },
  {
    mesh: sunSphere3,
    mass: sun3Mass,
    velocity: sun3Vel,
    acceleration: new THREE.Vector3(),
    frozen: false
  }
];

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

      const cluster = clusters[
        Math.floor(Math.random() * clusters.length)
      ];

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

    colors.push(
      r,
      g,
      b
    );
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colors, 3)
  );

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    sizeAttenuation: false
  });

  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      `
      #include <clipping_planes_fragment>

      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      float r = dot(cxy, cxy);

      if (r > 1.0) discard;
      `
    );
  };

  return new THREE.Points(geometry, material);
}

const stars1 = createStars(4000, 1);
stars1.frustumCulled = false;
scene.add(stars1);

const stars2 = createStars(800, 3);
stars2.frustumCulled = false;
scene.add(stars2);

const stars3 = createStars(100, 6);
stars3.frustumCulled = false;
scene.add(stars3);

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

// animation
function animate( time ) {

    // delta time
    const dt = 1//(time - lastTime) / 1000;
    lastTime = time;

    controls.update();

    // physics
    for (const A of bodies) {
      if (A.frozen) continue;

      const totalForce = new THREE.Vector3();

      for (const B of bodies) {
        if (B.frozen) continue;
        if (A === B) continue;
        
        const direction = new THREE.Vector3()
          .subVectors(B.mesh.position, A.mesh.position);
        const distance = Math.max(direction.length(), 2);
        
        direction.normalize();

        const forceStrength =
          G * A.mass * B.mass / (distance ** 2);
        
        const force = direction.clone()
          .multiplyScalar(forceStrength);

        totalForce.add(force);
      }

      // calculate acceleration Newton's Law
      const acceleration = totalForce.clone()
        .divideScalar(A.mass);

      // store acceleration
      A.acceleration.copy(acceleration);

    }

    for (const A of bodies) {
      if (A.frozen) continue;
      A.velocity.add(
      A.acceleration.clone().multiplyScalar(dt)
      );
    }

    const center = new THREE.Vector3();

    center.add(sunSphere.position);
    center.add(sunSphere2.position);
    center.add(sunSphere3.position);

    center.divideScalar(3);

    for (const A of bodies) {
      if (A.frozen) continue;
      A.mesh.position.add(
      A.velocity.clone().multiplyScalar(dt)
      );
      if (A.mesh.position.distanceTo(center) > 1000) {
        A.frozen = true;
      }
    }

    // corona
    corona.rotation.y += 0.001;
    corona.rotation.x += 0.0003;

    corona2.rotation.y += 0.001;
    corona2.rotation.x += 0.0003;

    corona3.rotation.y += 0.001;
    corona3.rotation.x += 0.0003;

    const pulse =
    1 +
    Math.sin(time * 0.001) * 0.02 +
    Math.sin(time * 0.0023) * 0.01;

    corona.scale.setScalar(pulse);
    corona2.scale.setScalar(pulse);
    corona3.scale.setScalar(pulse);

    // distance effect
    const distance = camera.position.length();
    const t = Math.min(distance / 200, 1);

    sunMaterial.emissiveIntensity = 2.5 - (1.2 * t);
    sunMaterial2.emissiveIntensity = 2.5 - (1.2 * t);
    sunMaterial3.emissiveIntensity = 2.5 - (1.2 * t);

    // sun rotation
    sunSphere.rotation.y += 0.002;
    sunSphere2.rotation.y += 0.002;
    sunSphere3.rotation.y += 0.002;

    composer.render();
}