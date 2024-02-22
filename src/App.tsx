import './App.css'

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/Addons.js';

function App() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111)
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  const geometry = new RoundedBoxGeometry(1, 1, 1);
  const loader = new THREE.CubeTextureLoader();
  loader.setPath('https://threejs.org/examples/textures/cube/pisa/');

  const textureCube = loader.load([
    'px.png', 'nx.png',
    'py.png', 'ny.png',
    'pz.png', 'nz.png'
  ]);
  const material = new THREE.MeshStandardMaterial({ color: "aqua", metalness: 1, roughness: 0.2, envMap: textureCube });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1)
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4)
  directionalLight.position.set(10, 20, 3)
  scene.add(directionalLight);

  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01; cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();

  return (
    <div>{renderer.domElement}</div>
  )
}

export default App
