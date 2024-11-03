import './style.css'
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'

const scene = new THREE.Scene();
// (FOV, AspectRatio, View Frustrum) 
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
})
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
const controls = new OrbitControls(camera, renderer.domElement);


camera.position.set(10, 10, 10);

// const spaceTexture = new THREE.TextureLoader().load('space.jpg');
// const geometry = new THREE.TetrahedronGeometry(10);
// const material = new THREE.MeshStandardMaterial({color: 0xffffff});
// const tetra = new THREE.Mesh(geometry, material);
// // const ambientLight = new THREE.AmbientLight();
// const pointLight = new THREE.PointLight(0x000000, 1000, 0, 2);
// pointLight.position.set(5, 5, 5);
// const ambientLight = new THREE.AmbientLight();
// const lightHelper = new THREE.PointLightHelper(pointLight);
// scene.add(tetra);
// scene.add(pointLight, lightHelper, gridHelper, ambientLight);
// const starGeometry = new THREE.SphereGeometry(0.25, 24, 24);
// const starMaterial = new THREE.MeshStandardMaterial( {color: 0xffffff});
// function addStar() {
//     const star = new THREE.Mesh(starGeometry, starMaterial);
//     const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
//     star.position.set(x, y, z);
//     scene.add(star);
// }
// function moveCamera(){
//     const t = document.body.getBoundingClientRect().top;
//     tetra.rotateX(0.0003);
//     camera.position.z = t * -0.03;
//     camera.position.x = t * -0.0002;
//     camera.position.y = t * -0.0002;
// }
// document.body.onscroll = moveCamera;
// Array(200).fill().forEach(addStar);
// scene.background = spaceTexture;

const gridHelper = new THREE.GridHelper(200, 50);
scene.add(gridHelper)

const ambientLight = new THREE.AmbientLight(0xffffff, 5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 500);
const pointHelper = new THREE.PointLightHelper(pointLight);
pointLight.position.set(5, 5, 5);
scene.add(pointLight, pointHelper);

let loadedModel;
const gltfLoader = new GLTFLoader();
gltfLoader.load('./assets/nissan_240sx_low_poly_rig/scene.gltf', (gltfScene) => {
    loadedModel = gltfScene;

    // gltfScene.scene.scale.set(100, 100, 100);
    scene.add(gltfScene.scene);
})


function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    controls.update()
}
animate()



