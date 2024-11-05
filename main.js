import './style.css'
// import * as THREE from 'three';
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
camera.lookAt(new THREE.Vector3(0, -5, 200));

// Adding a camera rig to follow the vehicle.
const cameraRig = new THREE.Object3D();
scene.add(cameraRig);

camera.position.set(6, 3, -6);
cameraRig.add(camera);

// Adding the grid.
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(gridHelper)


// Directional Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);
const directionalHelper = new THREE.DirectionalLightHelper(directionalLight);
scene.add(directionalHelper);
directionalLight.position.set(10, 10, -10).normalize;


// ------------------------------------------------------------------------------

// YUKA VEHICLE AI.
const myCar = new YUKA.Vehicle();
// Sync function for Yuka
function sync(entity, renderComponent){
    renderComponent.matrix.copy(entity.worldMatrix);
}
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
// Behaviour for car agent.
const followPathBehaviour = new YUKA.FollowPathBehavior(carPath, 8);
myCar.steering.add(followPathBehaviour);
const onPathBehaviour = new YUKA.OnPathBehavior(carPath);
myCar.steering.add(onPathBehaviour);
myCar.maxSpeed = 20;
const entityManager = new YUKA.EntityManager();
entityManager.add(myCar);

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

// ------------------------------------------------------------------------------

// Load the car model in.
let carModel;
const gltfLoader = new GLTFLoader();
gltfLoader.load('./assets/nissan_240sx_low_poly_rig/scene.gltf', (gltfScene) => {
    carModel = gltfScene.scene;
    scene.add(carModel);
    carModel.matrixAutoUpdate = false;
    myCar.setRenderComponent(carModel, sync);

})

// ------------------------------------------------------------------------------


const time = new YUKA.Time();

function moveCamera() {
    // Checks the car model is loaded first.
    if (carModel) {
        cameraRig.position.copy(myCar.position);

        cameraRig.lookAt(
            myCar.position.x + Math.sin(myCar.rotation.y),
            myCar.position.y,
            myCar.position.z + Math.cos(myCar.rotation.y)
        );
    }
}

// Normal animate function to update the scene.
function animate() {
    requestAnimationFrame(animate);

    const delta = time.update().getDelta();
    entityManager.update(delta);

    moveCamera();

    renderer.render(scene, camera);
}
animate()



