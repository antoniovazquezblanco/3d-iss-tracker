import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { SettingsOverlay } from './SettingsOverlay'
import { degToRad, noop } from './utils'
import { getLatLngObj, getSatelliteInfo } from 'tle.js'

const ORIGIN = new THREE.Vector3(0, 0, 0)
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const SUN_AT_NULL_ISLAND = new THREE.Vector3(0, 0, -5_000)

const EARTH_DIAMETER_POLES_KM = 12_714
const EARTH_DIAMETER_EQUATOR_KM = 12_756

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

const axesHelper = new THREE.AxesHelper(EARTH_DIAMETER_EQUATOR_KM)
scene.add(axesHelper)

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, Number.MAX_SAFE_INTEGER)
camera.position.x = EARTH_DIAMETER_EQUATOR_KM
camera.position.y = EARTH_DIAMETER_EQUATOR_KM
camera.position.z = EARTH_DIAMETER_EQUATOR_KM
camera.lookAt(ORIGIN)

const orbitControls = new OrbitControls(camera, renderer.domElement)
orbitControls.minDistance = EARTH_DIAMETER_EQUATOR_KM
orbitControls.maxDistance = EARTH_DIAMETER_EQUATOR_KM * 3

new GLTFLoader().load('models/Earth_1_12756.glb', gltf => {
   const box = new THREE.Box3().setFromObject(gltf.scene)
   const center = box.getCenter(new THREE.Vector3)

   gltf.scene.scale.setScalar(EARTH_DIAMETER_EQUATOR_KM / 1_000)
   gltf.scene.position.x += gltf.scene.position.x - center.x
   gltf.scene.position.y += gltf.scene.position.y - center.y
   gltf.scene.position.z += gltf.scene.position.z - center.z

   scene.add(gltf.scene)
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



// fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE')
Promise.resolve(`ISS (ZARYA)
1 25544U 98067A   22271.29875188  .00011405  00000+0  20504-3 0  9996
2 25544  51.6445 185.7292 0002377 302.6655 202.5977 15.50344723361171`)
   .then(
      tle => {
         console.debug('getLatLngObj(tle)', getLatLngObj(tle))
         console.debug('getSatelliteInfo(tle)', getSatelliteInfo(tle, Date.now()))

         new FBXLoader().load('models/ISSComplete1.fbx', object => {
            object.position.z = 1100
            object.scale.set(10, 10, 10)
            scene.add(object)
         }, noop, console.error)
      })

render()
