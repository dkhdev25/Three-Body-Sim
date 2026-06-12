import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );
const controls = new OrbitControls( camera, renderer.domElement );
const composer = new EffectComposer(renderer);

const loader = new THREE.TextureLoader();
const sunTexture = loader.load( './suntexture.jpeg' );
sunTexture.colorSpace = THREE.SRGBColorSpace;
sunTexture.wrapS = THREE.RepeatWrapping;

const spaceTexture = loader.load( './spacetexture2.jpg' );
spaceTexture.colorSpace = THREE.SRGBColorSpace;

// sun1
const sunGeometry = new THREE.SphereGeometry( 1, 32, 16 );
const sunMaterial = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: new THREE.Color(0xffffcc),
  emissiveMap: sunTexture, 
  emissiveIntensity: 3.0,               
  roughness: 1,
  metalness: 0
});
const sunSphere = new THREE.Mesh( sunGeometry, sunMaterial );
scene.add( sunSphere );

const sunSphere2 = sunSphere.clone();
sunSphere2.position.x = 15;
scene.add( sunSphere2 );

const sunSphere3 = sunSphere.clone();
sunSphere3.position.x = -15;
scene.add( sunSphere3 );

// space
const spaceGeometry = new THREE.SphereGeometry( 1200, 32, 16 );
const spaceMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.BackSide});
const spaceSphere = new THREE.Mesh( spaceGeometry, spaceMaterial );
scene.add( spaceSphere );

// stars
const starCount = 1000;

const positions = [];
const colors = [];

for (let i = 0; i < starCount; i++) {

  // Random distance from center
  const radius = 400 + Math.random() * 280;

  // Random direction
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  positions.push(x, y, z);

  // Random brightness
  const brightness = 0.2 + Math.pow(Math.random(), 0.3) * 0.8;

  colors.push(
    brightness,
    brightness,
    brightness
  );
}

const starGeometry = new THREE.BufferGeometry();

starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(positions, 3)
);

starGeometry.setAttribute(
  'color',
  new THREE.Float32BufferAttribute(colors, 3)
);

const starMaterial = new THREE.PointsMaterial({
  size: 4,
  vertexColors: true,
  sizeAttenuation: true
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// camera
camera.position.z = 5;

const renderScene = new RenderPass(scene, camera);
composer.addPass(renderScene);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
   2.0,
  0.8,
  0.15
);
composer.addPass(bloomPass);

function animate( time ) {
    controls.update();

    sunTexture.offset.x += 0.00005;

    sunSphere.rotation.x = time / 2000;
    sunSphere.rotation.y = time / 1000;

    sunSphere2.rotation.x = time / 2000;
    sunSphere2.rotation.y = time / 1000;

    sunSphere3.rotation.x = time / 2000;
    sunSphere3.rotation.y = time / 1000;

  composer.render();
}