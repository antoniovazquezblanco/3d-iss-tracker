import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { SettingsOverlay } from './SettingsOverlay'
import { noop } from './utils'
import { getLatLngObj } from 'tle.js'

const { degToRad } = THREE.MathUtils

const ORIGIN = new THREE.Vector3(0, 0, 0)
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const SUN_AT_NULL_ISLAND = new THREE.Vector3(0, 0, -5_000)

// TODO: Adjust based on https://en.m.wikipedia.org/wiki/World_Geodetic_System.
const EARTH_DIAMETER_POLES_KM = 12_714
const EARTH_DIAMETER_EQUATOR_KM = 12_756
const ISS_AVG_ALTITUDE_KM = 420

const MS_IN_HOUR = 60 * 60 * 1_000
const MS_IN_DAY = 24 * MS_IN_HOUR
const ROTATION_PER_MS_DEG = 360 / MS_IN_DAY

// TODO: Adjust based on WGS 84.
function latLngToVector3(lat: number, lng: number) {
   const phi = degToRad(90 - lat)
   const theta = degToRad(lng + 180)
   const radius = 6_371 + ISS_AVG_ALTITUDE_KM / 2

   return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
   )
}

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
orbitControls.minDistance = EARTH_DIAMETER_EQUATOR_KM / 1.5
orbitControls.maxDistance = EARTH_DIAMETER_EQUATOR_KM * 3

new GLTFLoader().load('models/Earth_1_12756.glb', gltf => {
   const box = new THREE.Box3().setFromObject(gltf.scene)
   const center = box.getCenter(new THREE.Vector3)

   gltf.scene.position.x += gltf.scene.position.x - center.x
   gltf.scene.position.y += gltf.scene.position.y - center.y
   gltf.scene.position.z += gltf.scene.position.z - center.z
   gltf.scene.scale.setScalar(EARTH_DIAMETER_EQUATOR_KM / 1_000)
   rotateAroundPoint(gltf.scene, ORIGIN, Y_AXIS, degToRad(-90))

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
   rotateAroundPoint(sunLight, ORIGIN, Y_AXIS, degToRad(rotationRad - 90))
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
1 25544U 98067A   22273.72802950  .00014755  00000+0  26205-3 0  9998
2 25544  51.6446 173.6890 0002611 316.4566  76.5686 15.50428186361551`)
   .then(
      tle => {
         new FBXLoader().load('models/ISSComplete1.fbx', object => {
            const { lat, lng } = getLatLngObj(tle)
            object.position.copy(latLngToVector3(lat, lng))
            object.scale.set(200, 200, 200)
            scene.add(object)
         }, noop, console.error)
      })

render()
