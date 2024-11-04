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
const controls = new OrbitControls(camera, renderer.domElement);

// Starting points for the camera with car position at origin.
const [cameraX, cameraY, cameraZ] = [2.685605316591597, 1.717229248991908, -4.089879259948045];
camera.position.set(cameraX, cameraY, cameraZ);
camera.lookAt(new THREE.Vector3(0, 0, 5));

// Adding the grid.
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(gridHelper)

// Ambient light.
const ambientLight = new THREE.AmbientLight(0xffffff, 10);
scene.add(ambientLight);

// Load the car model in.
let carModel;
let [carX, carY, carZ] = Array(3).fill(0);
const gltfLoader = new GLTFLoader();
gltfLoader.load('./assets/nissan_240sx_low_poly_rig/scene.gltf', (gltfScene) => {
    carModel = gltfScene;
    carModel.scene.position.set(carX, carY, carZ);
    scene.add(carModel.scene);
})

// Move the car along in a straight line, and make the camera follow.
// function moveCar() {
//     carZ += 0.1;
//     carModel.scene.position.set(carX, carY, carZ);
//     camera.position.set(cameraX + carX, cameraY + carY, cameraZ +carZ);
// }


// Adding in a vehicular path.
const vehicleGeometry = new THREE.ConeGeometry(2, 5, 8);
vehicleGeometry.rotateX(Math.PI * 0.5);
const vehicleMaterial = new THREE.MeshNormalMaterial();
const vehicleMesh = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
vehicleMesh.matrixAutoUpdate = false;
scene.add(vehicleMesh);

const vehicle = new YUKA.Vehicle();
vehicle.setRenderComponent(vehicleMesh, sync);

function sync(entity, renderComponent){
    renderComponent.matrix.copy(entity.worldMatrix);
}

// Creating a path for our vehicle to follow.
const carPath = new YUKA.Path();
carPath.add(new YUKA.Vector3(60, 0, -80));
carPath.add(new YUKA.Vector3(60, 0, 80));
carPath.add(new YUKA.Vector3(-60, 0, 80));
carPath.add(new YUKA.Vector3(-60, 0, -80));
carPath.loop = true;

vehicle.position.copy(carPath.current());

// Behaviours
const followPathBehaviour = new YUKA.FollowPathBehavior(carPath, 5);
vehicle.steering.add(followPathBehaviour);
const onPathBehaviour = new YUKA.OnPathBehavior(carPath);
vehicle.steering.add(onPathBehaviour);

vehicle.maxSpeed = 20;

const entityManager = new YUKA.EntityManager();
entityManager.add(vehicle);

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
    renderer.render(scene, camera);
    // moveCar()

    const delta = time.update().getDelta();
    entityManager.update(delta);

    controls.update();
}
animate()



