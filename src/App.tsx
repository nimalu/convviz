import './App.css'

import * as THREE from 'three';
import { AnimationClipCreator, RoundedBoxGeometry } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

type Number3 = [number, number, number]

function createCubeTexture() {
  const loader = new THREE.CubeTextureLoader();
  loader.setPath('https://threejs.org/examples/textures/cube/pisa/');

  const cubeTexture = loader.load([
    'px.png', 'nx.png',
    'py.png', 'ny.png',
    'pz.png', 'nz.png'
  ]);
  return cubeTexture
}

const cubeTexture = createCubeTexture()
function createCube() {
  const geometry = new RoundedBoxGeometry(0.8, 0.8, 0.8);
  geometry.translate(0.5, 0.5, 0.5)
  const material = new THREE.MeshStandardMaterial({ color: "white", metalness: 1, roughness: 0.4, envMap: cubeTexture });
  const cube = new THREE.Mesh(geometry, material);
  return cube
}

function createTensor(width: number, height: number, depth: number) {
  const group = new THREE.Group()
  const cubes: ReturnType<typeof createCube>[][][] = []
  for (let x = 0; x < width; x++) {
    cubes[x] = []
    for (let y = 0; y < height; y++) {
      cubes[x][y] = []
      for (let z = 0; z < depth; z++) {
        const cube = createCube()
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

function createEdgeCube(width: number, height: number, depth: number, thickness = 0.05) {
  const group = new THREE.Group()
  const material = new THREE.MeshBasicMaterial()
  let x = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, thickness), material)
  x.translateX(width / 2)
  group.add(x)
  x = x.clone()
  x.translateY(height)
  group.add(x)
  x = x.clone()
  x.translateZ(depth)
  group.add(x)
  x = x.clone()
  x.translateY(-depth)
  group.add(x)

  let y = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, thickness), material)
  y.translateY(height / 2)
  group.add(y)
  y = y.clone()
  y.translateX(width)
  group.add(y)
  y = y.clone()
  y.translateZ(depth)
  group.add(y)
  y = y.clone()
  y.translateX(-width)
  group.add(y)

  let z = new THREE.Mesh(new THREE.BoxGeometry(thickness, thickness, depth), material)
  z.translateZ(depth / 2)
  group.add(z)
  z = z.clone()
  z.translateX(width)
  group.add(z)
  z = z.clone()
  z.translateY(height)
  group.add(z)
  z = z.clone()
  z.translateX(-width)
  group.add(z)

  return group
}

function App() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111)
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(20, 20, 20)
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  const tensor = createTensor(10, 5, 5)
  tensor.setColor([0, 10, 1, 4, 1, 4], new THREE.Color("red"))
  tensor.group.position.set(0, 0, 0)
  scene.add(tensor.group)

  const edgeCube = createEdgeCube(10, 3, 3)
  edgeCube.position.set(0, 1, 1)
  scene.add(edgeCube)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1)
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4)
  directionalLight.position.set(10, 20, 3)
  scene.add(directionalLight);

  scene.add(new THREE.AxesHelper(100));

  const mixer = new THREE.AnimationMixer(edgeCube)
  function moveEdgeCube(from: Number3, to: Number3) {
    mixer.stopAllAction()
    const values = from.concat(to)
    const kfTrack = new THREE.VectorKeyframeTrack(".position", [0, 1], values)
    const clip = new THREE.AnimationClip('default', 2, [kfTrack])
    const clipAction = mixer.clipAction(clip)
    clipAction.repetitions = 1
    clipAction.clampWhenFinished = true
    clipAction.play()
  }

  moveEdgeCube([0, 0, 0], [0, 0, 1])
  setTimeout(() => moveEdgeCube([0, 0, 1], [0, 0, 2]), 2000)


  const clock = new THREE.Clock()

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    const delta = clock.getDelta()
    mixer.update(delta)
    renderer.render(scene, camera);
  }
  animate();

  return (
    <div>{renderer.domElement}</div>
  )
}

export default App
