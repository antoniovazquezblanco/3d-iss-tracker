import { SettingsOverlay } from './SettingsOverlay.js'

const ORIGIN = { x: 0, y: 0, z: 0 }
const Y_AXIS = { x: 0, y: 1, z: 0 }
const SUN_AT_NULL_ISLAND = { x: 0, y: 0, z: -5000 }

const MS_IN_HOUR = 60 * 60 * 1_000
const MS_IN_DAY = 24 * MS_IN_HOUR
const ROTATION_PER_MS_DEG = 360 / MS_IN_DAY

const degToRad = deg => deg * (Math.PI / 180)

function rotateAroundPoint(obj, point, axis, angle_rad) {
    obj.position.sub(point)
    obj.position.applyAxisAngle(axis, angle_rad)
    obj.position.add(point)
    obj.rotateOnAxis(axis, angle_rad)
}

// Create a renderer and corresponding DOM element
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)

// Create an scene
const scene = new THREE.Scene()

// Ambient light
const ambient_light = new THREE.AmbientLight(0xFFFFFF, 1.11)
ambient_light.name = 'ambient_light'
scene.add(ambient_light)

// Sun light
const sun_light = new THREE.DirectionalLight(0xFFCC99, 10)
sun_light.name = 'sun_light'
scene.add(sun_light)

let timeShift = 0

function positionSunLight() {
    const now = Date.now() + (timeShift * MS_IN_HOUR)

    let lastNoon = new Date().setUTCHours(12, 0, 0, 0)
    if (lastNoon > now) {
        lastNoon -= MS_IN_DAY
    }

    const msFromLastNoon = now - lastNoon
    const rotationAngle = msFromLastNoon * -ROTATION_PER_MS_DEG

    const { x, y, z } = SUN_AT_NULL_ISLAND
    sun_light.position.set(x, y, z)
    rotateAroundPoint(sun_light, ORIGIN, Y_AXIS, degToRad(rotationAngle))
}

const axesHelper = new THREE.AxesHelper(1_000)
scene.add(axesHelper)

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)

const controls = new THREE.OrbitControls(camera, renderer.domElement)
controls.minDistance = 600
controls.maxDistance = 2000

// Load a glTF resource
const loader = new THREE.GLTFLoader()
loader.load(
    // resource URL
    'models/Earth_1_12756.glb',
    // called when the resource is loaded
    gltf => {
            const model_scene = gltf.scene || gltf.scenes[0]
            if (!model_scene) {
                // Valid, but not supported by this viewer.
                throw new Error(
                    'This model contains no scene, and cannot be viewed here. However,'
                    + ' it may contain individual 3D resources.'
                )
            }

            const box = new THREE.Box3().setFromObject(model_scene)
            const size = box.getSize(new THREE.Vector3()).length()
            const center = box.getCenter(new THREE.Vector3())

            model_scene.position.x += (model_scene.position.x - center.x)
            model_scene.position.y += (model_scene.position.y - center.y)
            model_scene.position.z += (model_scene.position.z - center.z)
            camera.near = size / 100
            camera.far = size * 100
            camera.updateProjectionMatrix()

            camera.position.copy(center)
            camera.position.x += size / 2.0
            camera.position.y += size / 5.0
            camera.position.z += size / 2.0
            camera.lookAt(center)

            scene.add(model_scene)

            // console.log(gltf.animations) // Array<THREE.AnimationClip>
            // console.log(gltf.scene) // THREE.Group
            // console.log(gltf.scenes) // Array<THREE.Group>
            // console.log(gltf.cameras) // Array<THREE.Camera>
            // console.log(gltf.asset) // Object

            const settingsOverlay = SettingsOverlay({ ambientLightIntensity: ambient_light.intensity, timeShift })
            settingsOverlay.onAmbientLightIntensityChange = v => ambient_light.intensity = v
            settingsOverlay.onTimeShiftChange = v => timeShift = v

            document.body.style.margin = '0'
            document.body.style.fontFamily = 'sans-serif'
            document.body.append(settingsOverlay.root, renderer.domElement)
    },
    // called while loading is progressing
    xhr => {
        // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
    },
    // called when loading has errors
    error => console.log('An error happened', error)
)

// const light2 = new THREE.DirectionalLight(0xFFFFFF, 0.8 * Math.PI)
// light2.position.set(0.5, 0, 0.866) // ~60º
// light2.name = 'main_light'
// camera.add(light2)

// Animate the scene
function animate() {
    renderer.render(scene, camera)
    positionSunLight()
    requestAnimationFrame(animate)
}
animate()
