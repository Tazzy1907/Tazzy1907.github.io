import './style.css'
import * as THREE from 'three';
import * as YUKA from 'yuka';

// Map controls for debugging / development
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import { MapControls } from 'three/addons/controls/MapControls.js';

import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

// Useful things.
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap';

// For bloom and visual effects.
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';


// ------------------------------------------------------------------------------
// BASIC SETUP
// ------------------------------------------------------------------------------

const scene = new THREE.Scene();
// (FOV, AspectRatio, View Frustrum) 
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
})
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Adding BLOOM and glowing effects.
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, // strength of the bloom
    0.4, // radius of the bloom
    0.85 // threshold for what starts blooming
);
composer.addPass(bloomPass);

let debugMode = false;
// Orbit Controls.
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.enabled = false;
orbitControls.target.set(0, 0, 0);

// Map Controls.
// const mapControls = new MapControls(camera, renderer.domElement);
// mapControls.enableDamping = true;

// Adding the grid.
// const gridHelper = new THREE.GridHelper(1000, 250);
// scene.add(gridHelper)

// Starting points for the camera with car position at origin.
const [cameraX, cameraY, cameraZ] = [62.685605316591597, 1.717229248991908, -84.089879259948045];
camera.position.set(cameraX, cameraY, cameraZ);
camera.lookAt(new THREE.Vector3(0, -5, 200));

// Adding a camera rig to follow the vehicle.
const cameraRig = new THREE.Object3D();
scene.add(cameraRig);
camera.position.set(6, 3, -6);
cameraRig.add(camera);


// Directional Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);
const directionalHelper = new THREE.DirectionalLightHelper(directionalLight);
scene.add(directionalHelper);
directionalLight.position.set(10, 10, -10).normalize;

// ------------------------------------------------------------------------------
// LOADING IN MODELS
// ------------------------------------------------------------------------------
RectAreaLightUniformsLib.init();


// Load the car model in.
let carModel;
const gltfLoader = new GLTFLoader();
gltfLoader.load('./assets/nissan_240sx_low_poly_rig/scene.gltf', (gltfScene) => {
    carModel = gltfScene.scene;
    scene.add(carModel);
    carModel.matrixAutoUpdate = false;
    myCar.scale = new YUKA.Vector3(1.3, 1.3, 1.3);
    myCar.setRenderComponent(carModel, sync);

    carModel.traverse((child) => {
        if (child.isMesh) {
            // Change the brake lights to glow red.
            if (child.material.name.includes('kaca_bening')) {
                child.material.emissive = new THREE.Color(0xff0000);
                child.material.emissiveIntensity = 6;
            }
            // Change the front lights to glow purple.
            if (child.material.name.includes('lampu_depan')) {
                child.material.emissive = new THREE.Color(0xa020f0);
                child.material.emissiveIntensity = 10;
            }
        }
    });
});

// Loading in the city model.
let cityModel;
// gltfLoader.load('./assets/mycolouredcity/mycity.gltf', (gltfScene) => {
gltfLoader.load('./assets/cityWithCarGarage.gltf', (gltfScene) => {
    cityModel = gltfScene.scene;
    scene.add(cityModel);
    cityModel.scale.setScalar(70);
    cityModel.position.y -= 4.5;

    cityModel.traverse((child) => {
        if (child.isMesh) {
            // Make the tarmac a darker grey.
            if (child.material.name.includes('Meshpart3Mtl')) {
                child.material.color.setHex(0x6f6f6e); 
            }
        }
    });


    // FOR FINDING THE CENTER OF THE CITY COORDINATES.
    // const box = new THREE.Box3().setFromObject(cityModel);
    // const center = box.getCenter(new THREE.Vector3());
    // console.log('City Center:', center);
});


const garageLight = new THREE.RectAreaLight(0xff00ff, 5, 2, 50);
scene.add(garageLight);
garageLight.position.set(-10, 10, -160);
garageLight.rotation.x = -Math.PI / 2;

// const garageLightHelper = new RectAreaLightHelper(garageLight);
// scene.add(garageLightHelper);



// For the sky, may need replacing with a SkyBox.
const sphereGeo = new THREE.SphereGeometry(500, 60, 40);
const spaceTexture = new THREE.TextureLoader().load('./assets/spacePanorama-earth-4k.jpg');
const sphereMaterial = new THREE.MeshBasicMaterial( {
    map: spaceTexture
});
const skySphere = new THREE.Mesh(sphereGeo, sphereMaterial);
skySphere.material.side = THREE.BackSide;
scene.add(skySphere);


// ------------------------------------------------------------------------------
// YUKA VEHICLE AI.
// ------------------------------------------------------------------------------

const myCar = new YUKA.Vehicle();
// Sync function for Yuka
function sync(entity, renderComponent){
    renderComponent.matrix.copy(entity.worldMatrix);
}
// Creating a path for our vehicle to follow.
const carPath = new YUKA.Path(); // 3.25 scale from Blender
function createPath() {
    carPath.add(new YUKA.Vector3(105, 0, -80));
    carPath.add(new YUKA.Vector3(105, 0, -20));
    carPath.add(new YUKA.Vector3(200, 0, 75));
    carPath.add(new YUKA.Vector3(185, 0, 90));
    carPath.add(new YUKA.Vector3(190, 0, 130));
    carPath.add(new YUKA.Vector3(165, 0, 185));
    carPath.add(new YUKA.Vector3(120, 0, 225));
    carPath.add(new YUKA.Vector3(110, 0, 235));
    carPath.add(new YUKA.Vector3(45, 0, 235));
    carPath.add(new YUKA.Vector3(45, 0, 190));
    carPath.add(new YUKA.Vector3(120, 0, 120));
    carPath.add(new YUKA.Vector3(95, 0, 85));
    carPath.add(new YUKA.Vector3(45, 0, 120));
    carPath.add(new YUKA.Vector3(45, 0, 55));
    carPath.add(new YUKA.Vector3(100, 0, 0));
    carPath.add(new YUKA.Vector3(100, 0, -15));
    carPath.add(new YUKA.Vector3(90, 0, -25));
    carPath.add(new YUKA.Vector3(90, 0, -80));
    carPath.add(new YUKA.Vector3(75, 0, -90));
    carPath.add(new YUKA.Vector3(-50, 0, -90));
    carPath.add(new YUKA.Vector3(-50, 0, -105));
    carPath.add(new YUKA.Vector3(75, 0, -105));
    carPath.loop = true;
    myCar.position.copy(carPath.current());
}
createPath();

// Behaviour for car agent.
const followPathBehaviour = new YUKA.FollowPathBehavior(carPath, 5);
myCar.steering.add(followPathBehaviour);
const onPathBehaviour = new YUKA.OnPathBehavior(carPath);
myCar.steering.add(onPathBehaviour);
myCar.maxSpeed = 15;
const entityManager = new YUKA.EntityManager();
entityManager.add(myCar);

// FOR PATH DEBUGGING.

// TO DISPLAY THE PATH.
// Get all coordinate positions and store them in a list.
// const position = [];
// for(let i = 0; i < carPath._waypoints.length;i++) {
//     const waypoint = carPath._waypoints[i];
//     position.push(waypoint.x, waypoint.y, waypoint.z);
// }

// const lineGeometry = new THREE.BufferGeometry();
// lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
// const lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff});
// const lines = new THREE.LineLoop(lineGeometry, lineMaterial);
// scene.add(lines);

// ------------------------------------------------------------------------------
// CAMERA BASED FUNCTIONS
// ------------------------------------------------------------------------------

// Acts as an enum.
const cameraStates = Object.freeze({
    HOME: 0,
    EDUCATION: 1,
    EXPERIENCE: 2,
    PROJECTS: 3,
    LINKS: 4
});

const time = new YUKA.Time();

const cityCenter = new THREE.Vector3(119.17, 102.34, 94.36); // Center of the city
const orbitRadius = 102.34; // Distance from the center
const orbitHeight = 150; // Height above the center
const orbit = {angle: 0}
let activeAnimation = null;
let carFollow = cameraStates.HOME; // So we stop following the car.

// Function to kill any active animations.
function stopActiveAnimation() {
    if (activeAnimation) {
        activeAnimation.kill();
        activeAnimation = null;
    }
}



// Function for the HOME tab animation. - Following the car.
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

// Function for the EDUCATION tab animation - Orbit the city.
function orbitCamera() {
    // Assign so we can track whether the animation is running.
    activeAnimation = gsap.to(orbit, {
        angle: Math.PI * 2,
        duration: 30,
        repeat: -1,
        ease: "none",
        onUpdate: function() {
            camera.position.set(
                cityCenter.x + orbitRadius * Math.cos(orbit.angle),
                orbitHeight,
                cityCenter.z + orbitRadius * Math.sin(orbit.angle)
            );
            camera.lookAt(cityCenter);
        }
    })
}

// Code for transitioning to the orbit camera.    
function toEducationAnimation() {
    carFollow = cameraStates.EDUCATION;
    orbit.angle = 0;

    // Kills any existing animation it before restarting this one.
    stopActiveAnimation();

    // Get where the camera is currently looking.
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);

    activeAnimation = gsap.timeline()
        .to(currentLookAt, {
            x: cityCenter.x,
            y: cityCenter.y,
            z: cityCenter.z,
            duration: 4,
            onUpdate: function() {
                camera.lookAt(currentLookAt);
            }
        }, 0)

        .to(camera.position, {
            x: cityCenter.x + orbitRadius * Math.cos(0),
            y: orbitHeight,
            z: cityCenter.z + orbitRadius * Math.sin(0),
            duration: 4,
            ease: "power2.inOut",
            onComplete: function() {
                // Start the orbital motion after reaching the initial position
                orbitCamera();
            }
        }, 0);
}

// Switch to the orbit when education nav button is pressed.
document.getElementById('educationNav').addEventListener('click', function(e) {
    e.preventDefault();
    console.log("Switching to EDUCATION tab animation.")
    toEducationAnimation();
});

// Needs some work + a toHomeAnimation() function.
// document.getElementById('homeNav').addEventListener('click', function(e) {
//     e.preventDefault();
//     console.log("Switching to HOME tab animation.")
//     // toEducationAnimation();
//     if (orbitween) {
//         orbitween.kill();
//     }
//     carFollow = true;
// });

function toExperienceAnimation() {
    carFollow = cameraStates.EXPERIENCE;

    stopActiveAnimation();

    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);

    activeAnimation = gsap.timeline()
        .to(currentLookAt, {
            x: -100,
            y: 0,
            z: -470,
            duration: 4,
            onUpdate: function() {
                camera.lookAt(currentLookAt);
            }
        }, 0)

        .to(camera.position, {
            x: -110,
            y: 5,
            z: -75,
            duration: 4,
            ease: "power2.inOut"
        }, 0)
        
        .to()
        ;
}

document.getElementById('expNav').addEventListener('click', function(e) {
    e.preventDefault();
    console.log("Switching to EXPERIENCE tab animation.");
    toExperienceAnimation();
});

// window.addEventListener('mousedown', function() {
//     console.log("Mouse clicked!");
//     carFollow = cameraStates.EXPERIENCE;
//     gsap.to(camera.position, {
//         x: -107,
//         y: 5,
//         z: -70,
//         duration: 3
//     });
//     camera.lookAt(-100, 0, -470);
// })



// // FOR DEBUGGING.
// window.addEventListener('keydown', (event) => {
//     if (event.key.toLowerCase() == 'd') {
//         debugMode = !debugMode;
//         console.log("Debug mode ${debugMode ? 'enabled': 'disabled'}");

//         orbitControls.enabled = debugMode;

//         if (debugMode) {
//             if (orbitween) orbitween.kill();
//             carFollow = null;
//         }
//     }
// })


// ------------------------------------------------------------------------------
// REGULAR FUNCTIONS.
// ------------------------------------------------------------------------------
// Normal animate function to update the scene.
function animate() {
    requestAnimationFrame(animate);

    const delta = time.update().getDelta();
    entityManager.update(delta);

    if (!debugMode) {
        if (carFollow == cameraStates.HOME) {
            moveCamera();
        };
    } else {
        orbitControls.update();
        // console.log(camera.position, camera.rotation);
    }

    // console.log(orbitControls.enabled ? "OrbitControls active" : "OrbitControls disabled");


    // console.log(camera.position);
    composer.render();

    // mapControls.update();
}
animate()

// Initialize a new Lenis instance for smooth scrolling
const lenis = new Lenis();

// Listen for the 'scroll' event and log the event data to the console
lenis.on('scroll', (e) => {
  console.log(e);
});

// Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
// lenis.on('scroll', ScrollTrigger.update);

// Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
// This ensures Lenis's smooth scroll animation updates on each GSAP tick
gsap.ticker.add((time) => {
  lenis.raf(time * 1000); // Convert time from seconds to milliseconds
});

// Disable lag smoothing in GSAP to prevent any delay in scroll animations
gsap.ticker.lagSmoothing(0);

// ------------------------------------------------------------------------------



