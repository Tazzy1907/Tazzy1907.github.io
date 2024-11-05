import './style.css'
import * as THREE from 'three';
import * as YUKA from 'yuka';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'

// BASIC SETUP
const scene = new THREE.Scene();
// (FOV, AspectRatio, View Frustrum) 
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
})
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Orbit Controls.
// const controls = new OrbitControls(camera, renderer.domElement);

// Starting points for the camera with car position at origin.
const [cameraX, cameraY, cameraZ] = [62.685605316591597, 1.717229248991908, -84.089879259948045];
camera.position.set(cameraX, cameraY, cameraZ);
camera.lookAt(new THREE.Vector3(0, 0, 550));

// Adding the grid.
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(gridHelper)

// Ambient light.
const ambientLight = new THREE.AmbientLight(0xffffff, 10);
scene.add(ambientLight);

// YUKA VEHICLE AI.
const myCar = new YUKA.Vehicle();

// Creating a path for our vehicle to follow.
const carPath = new YUKA.Path();
carPath.add(new YUKA.Vector3(60, 0, -80));
carPath.add(new YUKA.Vector3(80, 0, 0));
carPath.add(new YUKA.Vector3(60, 0, 80));
carPath.add(new YUKA.Vector3(-60, 0, 80));
carPath.add(new YUKA.Vector3(-80, 0, 0));
carPath.add(new YUKA.Vector3(-60, 0, -80));
carPath.loop = true;

myCar.position.copy(carPath.current());

const followPathBehaviour = new YUKA.FollowPathBehavior(carPath, 8);
myCar.steering.add(followPathBehaviour);
const onPathBehaviour = new YUKA.OnPathBehavior(carPath);
myCar.steering.add(onPathBehaviour);
myCar.maxSpeed = 40;
const entityManager = new YUKA.EntityManager();
entityManager.add(myCar);

function sync(entity, renderComponent){
    renderComponent.matrix.copy(entity.worldMatrix);
}

// Load the car model in.
let carModel;
const gltfLoader = new GLTFLoader();
gltfLoader.load('./assets/nissan_240sx_low_poly_rig/scene.gltf', (gltfScene) => {
    carModel = gltfScene.scene;
    scene.add(carModel);
    carModel.matrixAutoUpdate = false;
    myCar.setRenderComponent(carModel, sync);

})

// TO DISPLAY THE PATH.
// Get all coordinate positions and store them in a list.
const position = [];
for(let i = 0; i < carPath._waypoints.length;i++) {
    const waypoint = carPath._waypoints[i];
    position.push(waypoint.x, waypoint.y, waypoint.z);
}

const lineGeometry = new THREE.BufferGeometry();
lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
const lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff});
const lines = new THREE.LineLoop(lineGeometry, lineMaterial);
scene.add(lines);

const time = new YUKA.Time();

// Normal animate function to update the scene.
function animate() {
    requestAnimationFrame(animate);

    const delta = time.update().getDelta();
    entityManager.update(delta);

    // if (carModel) {
    //     const carPosition = myCar.position; // Vector3
    //     const carDirection = myCar.rotation;

    //     const offsetDistance = 15;
    //     const offsetHeight = 5;

    //     const cameraOffset = new THREE.Vector3(
    //         carPosition.x - Math.sin(carDirection.y) * offsetDistance,
    //         carPosition.y + offsetHeight,
    //         carPosition.z - Math.cos(carDirection.y) * offsetDistance
    //     );

    //     camera.position.copy(cameraOffset);
    //     camera.lookAt(carPosition);

    //     console.log(camera.position);
    //     console.log(camera.rotation);
    // }

    renderer.render(scene, camera);


}
animate()



