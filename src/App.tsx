import './App.css'

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


function createCube(color?: THREE.ColorRepresentation) {
  const geometry = new RoundedBoxGeometry(0.8, 0.8, 0.8);
  geometry.translate(0.5, 0.5, 0.5)
  const material = new THREE.MeshLambertMaterial({ color: color ?? "white" });
  const cube = new THREE.Mesh(geometry, material);
  return cube
}

function createBlocks(width: number, height: number, depth: number, color?: THREE.ColorRepresentation) {
  const group = new THREE.Group()
  const cubes: ReturnType<typeof createCube>[][][] = []
  for (let x = 0; x < width; x++) {
    cubes[x] = []
    for (let y = 0; y < height; y++) {
      cubes[x][y] = []
      for (let z = 0; z < depth; z++) {
        const cube = createCube(color)
        cube.position.set(x, y, z)
        group.add(cube)
        cubes[x][y][z] = cube
      }
    }
  }

  function setColor(coordinates: [number, number, number, number, number, number], color: THREE.Color) {
    const [x1, x2, y1, y2, z1, z2] = coordinates
    for (let x = x1; x < x2; x++) {
      for (let y = y1; y < y2; y++) {
        for (let z = z1; z < z2; z++) {
          cubes[x][y][z].material.color = color
        }
      }
    }
  }
  return { group, cubes, setColor }
}

function createPaddedTensor(w: number, h: number, channels: number, padding: number, color1?: THREE.ColorRepresentation, color2?: THREE.ColorRepresentation) {
  const blocks = createBlocks(channels, w + 2 * padding, h + 2 * padding, color2)
  blocks.setColor([0, channels, padding, w + padding, padding, h + padding], new THREE.Color(color1 ?? "red"))
  blocks.group.position.set(0, 0, 0)
  return blocks
}


function App() {
  const wIn = 5;
  const hIn = 5;
  const channelIn = 8;
  const padding = 1;
  const filterSize = 3;
  const channelOut = 9;
  let wOut = (wIn - filterSize + 2 * padding) + 1;
  let hOut = (hIn - filterSize + 2 * padding) + 1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111)
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(40, 15, 30)
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new THREE.Vector3(20, 0, 0)
  controls.update();

  const tensor = createPaddedTensor(wIn, hIn, channelIn, padding, "red", "white")
  scene.add(tensor.group)

  const filterColors = ["blue", "cyan", "orange", "red", "yellow", "pink", "purple", "green", "gray"]

  let filter = createPaddedTensor(filterSize, filterSize, channelIn, 0, filterColors[0])
  filter.group.position.set(15, 0, 0)
  scene.add(filter.group)

  for (let i = 1; i < channelOut; i++) {
    filter = createPaddedTensor(filterSize, filterSize, channelIn, 0, filterColors[i % filterColors.length])
    filter.group.position.set(15, 0, -wIn - (filterSize + 1) * i)
    scene.add(filter.group)
  }


  const tensorOut = createPaddedTensor(wOut, hOut, channelOut, 0, "green")
  tensorOut.group.position.set(30, 0, 0)
  for (let i = 0; i < channelOut; i++) {
    tensorOut.setColor([i, i + 1, 0, wOut, 0, hOut], new THREE.Color(filterColors[i % filterColors.length]))
  }
  scene.add(tensorOut.group)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1)
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4)
  directionalLight.position.set(10, 20, 3)
  scene.add(directionalLight);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return (
    <div>{renderer.domElement}</div>
  )
}

export default App
