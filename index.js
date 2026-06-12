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

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );
const controls = new OrbitControls( camera, renderer.domElement );
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
sunSphere.position.set(0, 18, 10);
scene.add(sunSphere);

const sunSphere2 = new THREE.Mesh(sunGeometry, sunMaterial2);
sunSphere2.position.set(-20, -12, -8);
scene.add(sunSphere2);

const sunSphere3 = new THREE.Mesh(sunGeometry, sunMaterial3);
sunSphere2.position.set(20, -12, 8);
scene.add(sunSphere3);

sunSphere.scale.setScalar(1.4);
sunSphere2.scale.setScalar(1.0);
sunSphere3.scale.setScalar(0.8);

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
camera.position.set(0, 4, 40);

controls.target.set(0, 2, 0);
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

// animation
function animate( time ) {
    controls.update();

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

    const distance = camera.position.length();
    const t = Math.min(distance / 200, 1);

    sunMaterial.emissiveIntensity = 2.5 - (1.2 * t);
    sunMaterial2.emissiveIntensity = 2.5 - (1.2 * t);
    sunMaterial3.emissiveIntensity = 2.5 - (1.2 * t);

    sunSphere.rotation.y += 0.002;
    sunSphere2.rotation.y += 0.002;
    sunSphere3.rotation.y += 0.002;

    composer.render();
}