import { SettingsOverlay } from './SettingsOverlay.js'

// Create a renderer and corresponding DOM element
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)

// Create an scene
const scene = new THREE.Scene()

// Ambiemt light
const ambient_light = new THREE.AmbientLight(0xFFFFFF, 1)
ambient_light.name = 'ambient_light'
ambient_light.intensity = 1
scene.add(ambient_light)

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
camera.position.z = 1000
// scene.add(camera)

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

            console.log(gltf.animations) // Array<THREE.AnimationClip>
            console.log(gltf.scene) // THREE.Group
            console.log(gltf.scenes) // Array<THREE.Group>
            console.log(gltf.cameras) // Array<THREE.Camera>
            console.log(gltf.asset) // Object
    },
    // called while loading is progressing
    xhr => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
    // called when loading has errors
    error => console.log('An error happened', error)
)

// const light2 = new THREE.DirectionalLight(0xFFFFFF, 0.8 * Math.PI)
// light2.position.set(0.5, 0, 0.866) // ~60º
// light2.name = 'main_light'
// camera.add(light2)

const settingsOverlay = SettingsOverlay({ ambientLightIntensity: ambient_light.intensity })
settingsOverlay.onAmbientLightIntensityChange = v => ambient_light.intensity = v

document.body.style.margin = '0'
document.body.style.fontFamily = 'sans-serif'
document.body.append(settingsOverlay.root, renderer.domElement)

// Animate the scene
function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}
animate()
