import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SettingsOverlay } from './SettingsOverlay'
import { degToRad, noop } from './utils'

const ORIGIN = new THREE.Vector3(0, 0, 0)
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const SUN_AT_NULL_ISLAND = new THREE.Vector3(0, 0, -5_000)

const MS_IN_HOUR = 60 * 60 * 1_000
const MS_IN_DAY = 24 * MS_IN_HOUR
const ROTATION_PER_MS_DEG = 360 / MS_IN_DAY

function rotateAroundPoint(obj: THREE.Object3D, point: THREE.Vector3, axis: THREE.Vector3, rotationRad: number) {
   obj.position.sub(point)
   obj.position.applyAxisAngle(axis, rotationRad)
   obj.position.add(point)
   obj.rotateOnAxis(axis, rotationRad)
}

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)

const scene = new THREE.Scene()

const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.11)
scene.add(ambientLight)

const sunLight = new THREE.DirectionalLight(0xFFCC99, 10)
scene.add(sunLight)

const axesHelper = new THREE.AxesHelper(1_000)
scene.add(axesHelper)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1_000)

const orbitControls = new OrbitControls(camera, renderer.domElement)
orbitControls.minDistance = 600
orbitControls.maxDistance = 2_000

new GLTFLoader().load('models/Earth_1_12756.glb', gltf => {
   const modelScene = gltf.scene || gltf.scenes[0]
   if (!modelScene) {
      throw new Error('Failed to load model.')
   }

   const box = new THREE.Box3().setFromObject(modelScene)
   const size = box.getSize(new THREE.Vector3()).length()
   const center = box.getCenter(new THREE.Vector3())

   modelScene.position.x += modelScene.position.x - center.x
   modelScene.position.y += modelScene.position.y - center.y
   modelScene.position.z += modelScene.position.z - center.z

   camera.near = size / 100
   camera.far = size * 100
   camera.updateProjectionMatrix()

   camera.position.copy(center)
   camera.position.x += size / 2
   camera.position.y += size / 5
   camera.position.z += size / 2
   camera.lookAt(center)

   scene.add(modelScene)
}, noop, console.error)

let timeShift = 0

function positionSunLight() {
   const now = Date.now() + timeShift * MS_IN_HOUR

   let lastNoon = new Date().setUTCHours(12, 0, 0, 0)
   if (lastNoon > now) {
      lastNoon -= MS_IN_DAY
   }

   const msFromLastNoon = now - lastNoon
   const rotationRad = msFromLastNoon * -ROTATION_PER_MS_DEG

   const { x, y, z } = SUN_AT_NULL_ISLAND
   sunLight.position.set(x, y, z)
   rotateAroundPoint(sunLight, ORIGIN, Y_AXIS, degToRad(rotationRad))
}

function render() {
   positionSunLight()
   renderer.render(scene, camera)
   requestAnimationFrame(render)
}

const settingsOverlay = SettingsOverlay({
   ambientLightIntensity: ambientLight.intensity,
   onAmbientLightIntensityChange: v => ambientLight.intensity = v,
   timeShift,
   onTimeShiftChange: v => timeShift = v
})

document.body.style.margin = '0'
document.body.style.fontFamily = 'sans-serif'
document.body.style.backgroundColor = '#000'
document.body.append(settingsOverlay, renderer.domElement)

render()
