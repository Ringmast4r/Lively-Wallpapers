import * as THREE from "./three.module.min.js";
import * as stars from "./stars.js";

const CAMERA_HFOV = 56;
const CAMERA_TILT = 23.5 * Math.PI / 180.0;

const colorSchemes = {
    "Basic": {
        background: 0x111111,
        stars: [0x494949, 0x6d6d6d, 0x929292, 0xb6b6b6, 0xdbdbdb, 0xffffff]
    },
    "Catppuccin Mocha": {
        background: 0x1e1e2e,
        stars: [0x6c7086, 0x7f849c, 0x9399b2, 0xa6adc8, 0xbac2de, 0xcdd6f4]
    }
};

const properties = {
    rotationRate: 0.5 * Math.PI / 180.0,
    colorScheme: "Catppuccin Mocha",
};

let camera, scene, geometry, points, renderer;
let target = new THREE.Vector3(0.0, 0.0, -1.0);

init();

function init() {
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(CAMERA_HFOV * aspect, aspect, 0.01, 1000);
    camera.lookAt(target);
    camera.rotation.z = CAMERA_TILT;

    scene = new THREE.Scene();

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(stars.coordinates, 3));
    geometry.computeBoundingSphere();

    const material = new THREE.PointsMaterial({ fog: false, size: 3.0, sizeAttenuation: false, vertexColors: true });
    points = new THREE.Points(geometry, material);

    updateColors();

    scene.add(points);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animationLoop);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

function updateColors() {
    const scheme = colorSchemes[properties.colorScheme];

    scene.background = new THREE.Color(scheme.background);

    const colors = [];
    const color = new THREE.Color();
    for (let i = 0; i < stars.magnitudes.length; i++) {
        let mag = stars.magnitudes[i];
        if (mag > 5.5) color.set(scheme.stars[0]);
        else if (mag > 4.5) color.set(scheme.stars[1]);
        else if (mag > 3.5) color.set(scheme.stars[2]);
        else if (mag > 2.5) color.set(scheme.stars[3]);
        else if (mag > 1.5) color.set(scheme.stars[4]);
        else color.set(scheme.stars[5]);
        colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animationLoop(now) {
    // Cut the rate in half since the sphere spins in the opposite direction
    const t = 0.5 * properties.rotationRate * (now * 0.001);

    target.x = Math.cos(t);
    target.z = Math.sin(t);
    target.y = Math.sin(t);
    camera.lookAt(target);

    points.rotation.y = t;

    renderer.render(scene, camera);
}
