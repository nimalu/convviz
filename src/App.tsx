import './App.css'

import chroma from "chroma-js";
import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer, RoundedBoxGeometry } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Show, createEffect, createSignal } from 'solid-js';
import NumberInput from './components/NumberInput';
import { debounce } from '@solid-primitives/scheduled';
import Header from './components/Header';
import GithubLink from './components/GithubLink';


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
  const blocks = createBlocks(channels, h + 2 * padding, w + 2 * padding, color2)
  blocks.setColor([0, channels, padding, h + padding, padding, w + padding], new THREE.Color(color1 ?? "white"))
  blocks.group.position.set(0, 0, 0)
  return blocks
}


function App() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3f4f6)
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(15, 15, 30)
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  const labelRenderer = new CSS2DRenderer()
  labelRenderer.domElement.className = "label-renderer"
  let canvasWrapper = document.querySelector("#renderer");
  function resizeCanvasToDisplaySize() {
    if (!canvasWrapper) {
      canvasWrapper = document.querySelector("#renderer");
      if (!canvasWrapper) {
        return
      }
    }
    const width = canvasWrapper.clientWidth;
    const height = canvasWrapper.clientHeight;

    if (renderer.domElement.width !== width || renderer.domElement.height !== height) {
      renderer.setSize(width, height, false);
      labelRenderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }
  const controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.target.set(0, 2, 0)
  controls.update();

  const [loading, setLoading] = createSignal(true)

  const tensors = new THREE.Group()
  scene.add(tensors)
  function populateTensors({ wIn, hIn, channelIn, padding, filterSize, channelOut, stride }: {
    wIn: number, hIn: number, channelIn: number, padding: number, filterSize: number, channelOut: number, stride: number
  }) {
    tensors.clear()
    labelRenderer.domElement.innerHTML = ""

    let wOut = (wIn - filterSize + 2 * padding) / stride + 1;
    let hOut = (hIn - filterSize + 2 * padding) / stride + 1;

    const tensorIn = createPaddedTensor(wIn, hIn, channelIn, padding, "#fa70b5", "#ffd2e6")
    tensorIn.group.position.set(-channelIn - 5, 0, 0)
    const tensorInLabelDiv = document.createElement('div');
    tensorInLabelDiv.className = 'label';
    tensorInLabelDiv.innerHTML = `Tensor In<br>${wIn}x${hIn}x${channelIn} <br> (+padding)`
    const tensorInLabel = new CSS2DObject(tensorInLabelDiv);
    tensorInLabel.position.set(channelIn / 2, 0, wIn + padding * 2 + 4);
    tensorIn.group.add(tensorInLabel);
    tensors.add(tensorIn.group)

    const filterColors = chroma.scale(['#2a4858', '#fafa6e']).mode('lch').colors(channelOut);
    let filter = createPaddedTensor(filterSize, filterSize, channelIn, 0, filterColors[0])
    filter.group.position.set(0, hIn / 2 - filterSize / 4, wIn / 2 - filterSize / 4)
    tensors.add(filter.group)

    for (let i = 1; i < channelOut; i++) {
      filter = createPaddedTensor(filterSize, filterSize, channelIn, 0, filterColors[i % filterColors.length])
      filter.group.position.set(0, hIn / 2 - filterSize / 2, - (filterSize + 1) * (i + 1))
      tensors.add(filter.group)
    }

    const filterLabelDiv = document.createElement('div');
    filterLabelDiv.className = 'label';
    filterLabelDiv.innerHTML = `${channelOut} Filters<br>${filterSize}x${filterSize}x${channelIn}`
    const filterLabel = new CSS2DObject(filterLabelDiv);
    filterLabel.position.set(channelIn * 1.5 + 5, 0, wIn + 4 + padding * 2);
    tensorIn.group.add(filterLabel);


    const tensorOut = createPaddedTensor(wOut, hOut, channelOut, 0)
    tensorOut.group.position.set(channelIn + 5, (hIn + 2 * padding - hOut) / 2, (wIn + 2 * padding - wOut) / 2)
    for (let i = 0; i < channelOut; i++) {
      tensorOut.setColor([i, i + 1, 0, hOut, 0, wOut], new THREE.Color(filterColors[i % filterColors.length]))
    }
    tensors.add(tensorOut.group)

    const tensorOutDiv = document.createElement('div');
    tensorOutDiv.className = 'label';
    tensorOutDiv.innerHTML = `Tensor Out<br>${wOut}x${hOut}x${channelOut}`
    const tensorOutLabel = new CSS2DObject(tensorOutDiv);
    tensorOutLabel.position.set(2 * channelIn + 10 + channelOut / 2, 0, wIn + 4 + padding * 2);
    tensorIn.group.add(tensorOutLabel);

    setLoading(false)
  }

  const debouncedPopulateTensors = debounce(populateTensors, 500)

  const [filterSize, setFilterSize] = createSignal(3);
  const [wIn, setWIn] = createSignal(5);
  const [hIn, setHIn] = createSignal(5);
  const [channelIn, setChannelIn] = createSignal(3);
  const [channelOut, setChannelOut] = createSignal(5);
  const [padding, setPadding] = createSignal(1);
  const [stride, setStride] = createSignal(1);
  createEffect(() => {
    if (!isValid()) {
      return
    }
    setLoading(true)
    debouncedPopulateTensors({
      wIn: wIn(), hIn: hIn(), channelIn: channelIn(), padding: padding(), filterSize: filterSize(), channelOut: channelOut(), stride: stride()
    })
  });

  const isValid = () => {
    const t1 = (wIn() - filterSize() + 2 * padding()) / stride()
    const t2 = (hIn() - filterSize() + 2 * padding()) / stride()
    return Number.isInteger(t1) && Number.isInteger(t2)
  }


  const ambientLight = new THREE.AmbientLight(0xffffff, 1)
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4)
  directionalLight.position.set(10, 20, 3)
  scene.add(directionalLight);


  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    resizeCanvasToDisplaySize()
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera)
  }
  animate();

  return (
    <>
      <div id='param-controls'>
        <Header />
        <NumberInput value={wIn()} onchange={setWIn} label='Width' />
        <NumberInput value={hIn()} onchange={setHIn} label='Height' />
        <NumberInput value={channelIn()} onchange={setChannelIn} label='Channel in' />
        <NumberInput value={filterSize()} onchange={setFilterSize} label="Filter size" />
        <NumberInput value={channelOut()} onchange={setChannelOut} label='Channel out' />
        <NumberInput value={padding()} onchange={setPadding} label='Padding' />
        <NumberInput value={stride()} onchange={setStride} label='Stride' />
        <Show when={!isValid()}>
          <div class="alert">Invalid combination</div>
        </Show>
        <GithubLink />
      </div>
      <div id='renderer' classList={{ loading: loading() }}>{renderer.domElement} {labelRenderer.domElement}</div>
    </>
  )
}

export default App
