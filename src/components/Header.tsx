import "./Header.css"
import * as THREE from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/Addons.js";

export default function Header() {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color("white")
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    camera.position.z = 3;
    camera.position.y = 1;
    camera.lookAt(new THREE.Vector3(0, 0, 0))
    const renderer = new THREE.WebGLRenderer({ antialias: true })

    const block = new THREE.Mesh(
        new RoundedBoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({ color: "#fa70b5" })
    )
    scene.add(block)

    scene.add(new THREE.AmbientLight("white", 1))
    const light = new THREE.DirectionalLight("white", 4)
    light.position.set(1, 2, 0)
    scene.add(light)

    function animate() {
        requestAnimationFrame(animate);
        block.rotation.x += 0.01
        block.rotation.z += 0.01
        renderer.render(scene, camera);
    }
    animate();
    return <a id="header" href="/">
        {renderer.domElement}
        <h1>Convviz</h1>
    </a>
}