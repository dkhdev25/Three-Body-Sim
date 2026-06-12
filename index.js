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

// #space
const spaceGeometry = new THREE.SphereGeometry( 50, 32, 16 );
const spaceMaterial = new THREE.MeshBasicMaterial({map: spaceTexture, side: THREE.BackSide});
const spaceSphere = new THREE.Mesh( spaceGeometry, spaceMaterial );
scene.add( spaceSphere );

camera.position.z = 5;

const renderScene = new RenderPass(scene, camera);
composer.addPass(renderScene);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
   2.0,  // strength
  0.8,  // radius
  0.15  // threshold
);
composer.addPass(bloomPass);

function animate( time ) {
    controls.update();

    sunTexture.offset.x += 0.0005;

    sunSphere.rotation.x = time / 2000;
    sunSphere.rotation.y = time / 1000;

  composer.render();
}