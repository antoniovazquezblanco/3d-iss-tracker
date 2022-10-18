import {
   AmbientLight,
   AxesHelper,
   Box3,
   BufferGeometry,
   ConeGeometry,
   DirectionalLight,
   DodecahedronGeometry,
   GridHelper,
   Line,
   LineBasicMaterial,
   LineDashedMaterial,
   MathUtils,
   Mesh,
   MeshStandardMaterial,
   Object3D,
   PerspectiveCamera,
   Raycaster,
   Scene,
   SphereGeometry,
   Vector2,
   Vector3,
   WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { getLatLngObj } from 'tle.js'
import { SettingsOverlay } from './SettingsOverlay'
import {
   EARTH_DIAMETER_EQUATOR_KM,
   EARTH_RADIUS_AVG_KM,
   getIssTle,
   ISS_ALTITUDE_AVG_KM,
   latLngFromVector3,
   latLngToVector3,
   latLongDistanceKm,
   loadGltfModel,
   MS_IN_DAY,
   MS_IN_HOUR,
   NULL_ISLAND,
   ORIGIN,
   rotateAroundPoint,
   ROTATION_PER_MS_DEG,
   Y_AXIS
} from './utils'

const { degToRad } = MathUtils

const renderer = new WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true })
renderer.setSize(window.innerWidth, window.innerHeight)

const scene = new Scene()

const ambientLight = new AmbientLight(0xFFFFFF, 0.5)
scene.add(ambientLight)

const sunLight = new DirectionalLight(0xDDBB99, 5)
scene.add(sunLight)

const axes = new AxesHelper(EARTH_DIAMETER_EQUATOR_KM)
axes.visible = false
scene.add(axes)

const grid = new GridHelper(20_000, 20)
grid.visible = false
scene.add(grid)

const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, Number.MAX_SAFE_INTEGER)
camera.position.setScalar(10_500)
camera.lookAt(ORIGIN)

// TODO...?
// const skyBoxGeometry = new SphereGeometry(Number.MAX_SAFE_INTEGER, 32, 32)
// const skyBoxMaterial = new MeshPhongMaterial({
//    map: new TextureLoader().load('assets/milky-way.jpeg'),
//    flatShading: true,
//    transparent: true,
//    opacity: 0.5
// })
// const skyBox = new Mesh(skyBoxGeometry, skyBoxMaterial)
// skyBox.material.side = BackSide
// scene.add(skyBox)

const orbitControls = new OrbitControls(camera, renderer.domElement)
orbitControls.minDistance = EARTH_DIAMETER_EQUATOR_KM / 1.5
orbitControls.maxDistance = EARTH_DIAMETER_EQUATOR_KM * 3

let frameTime = Date.now()
let timeShift = 0
let futureOrbit = 1.5 * MS_IN_HOUR
let pastOrbit = 1.5 * MS_IN_HOUR

function positionSunLight() {
   let lastNoon = new Date().setUTCHours(12, 0, 0, 0)
   if (lastNoon > frameTime) {
      lastNoon -= MS_IN_DAY
   }

   const msFromLastNoon = frameTime - lastNoon
   const rotationRad = msFromLastNoon * -ROTATION_PER_MS_DEG

   const { x, y, z } = NULL_ISLAND
   sunLight.position.set(x, y, z)
   rotateAroundPoint(sunLight, ORIGIN, Y_AXIS, degToRad(rotationRad - 90))
}

const tempEarthGeometry = new SphereGeometry(EARTH_RADIUS_AVG_KM, 32, 32)
const tempEarthMaterial = new MeshStandardMaterial({ color: 0x000007 })
const tempEarthSphere = new Mesh(tempEarthGeometry, tempEarthMaterial)
scene.add(tempEarthSphere)

// TODO: Verify Earth has the right inclination.
loadGltfModel('assets/earth.glb').then(gltf => {
   const box = new Box3().setFromObject(gltf.scene)
   const center = box.getCenter(new Vector3)

   gltf.scene.position.x += gltf.scene.position.x - center.x
   gltf.scene.position.y += gltf.scene.position.y - center.y
   gltf.scene.position.z += gltf.scene.position.z - center.z
   gltf.scene.scale.setScalar(EARTH_DIAMETER_EQUATOR_KM / 1_000)
   rotateAroundPoint(gltf.scene, ORIGIN, Y_AXIS, degToRad(-90))

   scene.remove(tempEarthSphere)
   scene.add(gltf.scene)
})

renderer.domElement.addEventListener('click', ev => {
   ev.preventDefault()

   const canvas = renderer.domElement
   const canvasRect = canvas.getBoundingClientRect()

   const mousePosition = new Vector2
   mousePosition.x = ((ev.clientX - canvasRect.left) / canvas.width) * 2 - 1
   mousePosition.y = -((ev.clientY - canvasRect.top) / canvas.height) * 2 + 1

   const rayCaster = new Raycaster
   rayCaster.setFromCamera(mousePosition, camera)

   const intersects = rayCaster.intersectObjects([tempEarthSphere])
   if (intersects.length === 0) {
      return
   }

   const clickLatLng = latLngFromVector3(intersects[0].point)

   let time = frameTime
   while (true) {
      time += 60_000
      const issLatLng = getLatLngObj(issTle, time)
      const kmToIss = latLongDistanceKm(clickLatLng, issLatLng)
      if (kmToIss < 100) {
         console.log(`The ISS will be fairly close to you by ${new Date(time).toISOString()}! :D`)
         break
      }
      if (time - frameTime > 30 * MS_IN_DAY) {
         console.log(`The ISS won't be near you for the next month :(`)
         break
      }
   }
})

let issObject: Object3D | undefined
let issTle = `ISS (NAUKA)
1 49044U 21066A   22290.50488293  .00013999  00000+0  25167-3 0  9994
2 49044  51.6427  90.5895 0003447 313.4987 150.1352 15.50128511364152`

const issScale = 3 // TODO: Adjust.

const tempIssGeometry = new DodecahedronGeometry(25)
const tempIssMaterial = new MeshStandardMaterial({ color: 0x111111 })
const tempIssBox = new Mesh(tempIssGeometry, tempIssMaterial)
tempIssBox.scale.setScalar(issScale)
issObject = tempIssBox
scene.add(tempIssBox)

// Make the cone taller to avoid a gap between the cone and Earth as the Earth curves.
// TODO: Adjust the cone so that its projection into the Earth's surface is ~1800km – without magic number 300.
const issBeamGeometry = new ConeGeometry(1_800, ISS_ALTITUDE_AVG_KM + 300, 256)
const issBeamMaterial = new MeshStandardMaterial({ color: 0x11ff11, transparent: true, opacity: 0.25 })
const issBeam = new Mesh(issBeamGeometry, issBeamMaterial)
issBeam.geometry.rotateX(degToRad(-90))
scene.add(issBeam)

loadGltfModel('assets/iss.glb').then(gltf => {
   gltf.scene.scale.setScalar(issScale)
   scene.remove(tempIssBox)
   issObject = gltf.scene
   scene.add(gltf.scene)
})

// TODO: Apply glowing and/or fading effect.
const issFutureOrbitMaterial = new LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9 })
const issFutureOrbitGeometry = new BufferGeometry()
const issFutureOrbitLine = new Line(issFutureOrbitGeometry, issFutureOrbitMaterial)
scene.add(issFutureOrbitLine)

const issPastOrbitMaterial = new LineDashedMaterial({ color: 0xff00ff, transparent: true, opacity: 0.9, gapSize: 500, dashSize: 500 })
const issPastOrbitGeometry = new BufferGeometry()
const issPastOrbitLine = new Line(issPastOrbitGeometry, issPastOrbitMaterial)
scene.add(issPastOrbitLine)

function positionIss() {
   if (!issObject) return

   const { lat, lng } = getLatLngObj(issTle, frameTime)
   // TODO: Position at exact altitude.
   const radius = 6_371 + ISS_ALTITUDE_AVG_KM
   issObject.position.copy(latLngToVector3(lat, lng, radius))
   issObject.lookAt(ORIGIN)
   issBeam.position.copy(latLngToVector3(lat, lng, radius - issBeamGeometry.parameters.height / 2))
   issBeam.lookAt(ORIGIN)

   const issFuturePoints: Vector3[] = []
   for (let i = 1; i <= futureOrbit; i += 60_000) {
      const { lat, lng } = getLatLngObj(issTle, frameTime + i)
      issFuturePoints.push(latLngToVector3(lat, lng, radius))
   }
   issFutureOrbitGeometry.setFromPoints(issFuturePoints)

   const issPastPoints: Vector3[] = []
   for (let i = 1; i <= pastOrbit; i += 60_000) {
      const { lat, lng } = getLatLngObj(issTle, frameTime - i)
      issPastPoints.push(latLngToVector3(lat, lng, radius))
   }
   issPastOrbitGeometry.setFromPoints(issPastPoints)
   issPastOrbitLine.computeLineDistances()
}

function refreshIssTle() {
   getIssTle().then(tle => issTle = tle)
}

refreshIssTle()
setInterval(refreshIssTle, MS_IN_DAY)

const settingsOverlay = SettingsOverlay({
   ambientLightIntensity: ambientLight.intensity,
   onAmbientLightIntensityChange: v => ambientLight.intensity = v,
   sunLightIntensity: sunLight.intensity,
   onSunLightIntensityChange: v => sunLight.intensity = v,
   timeShift,
   onTimeShiftChange: v => timeShift = v,
   axesVisible: axes.visible,
   onAxesVisibleChange: v => axes.visible = grid.visible = v,
   futureOrbit,
   onFutureOrbitChange: v => futureOrbit = v,
   pastOrbit,
   onPastOrbitChange: v => pastOrbit = v
})

const timeDisplay = document.createElement('div')
timeDisplay.style.userSelect = 'none'
timeDisplay.style.position = 'fixed'
timeDisplay.style.bottom = timeDisplay.style.left = '8px'
timeDisplay.style.fontSize = '14px'
timeDisplay.style.color = 'rgb(255 255 255 / 75%)'
timeDisplay.style.textShadow = '0 0 5px rgb(255 255 255 / 50%)'

document.body.style.margin = '0'
document.body.style.fontFamily = 'sans-serif'
document.body.style.backgroundImage = 'radial-gradient(#123, #000)'
document.body.style.accentColor = '#343d46'
document.body.append(settingsOverlay, timeDisplay, renderer.domElement)

window.addEventListener('resize', () => {
   const { innerWidth, innerHeight } = window

   camera.aspect = innerWidth / innerHeight
   camera.updateProjectionMatrix()

   renderer.setSize(innerWidth, innerHeight)
})

function render() {
   frameTime = Date.now() + timeShift

   timeDisplay.textContent = new Date(frameTime).toISOString().slice(0, -5) + 'Z'
   timeDisplay.style.color = timeShift > 0
      ? 'rgb(255 100 100 / 75%)'
      : timeShift < 0
      ? 'rgb(255 100 255 / 75%)'
      : 'rgb(255 255 255 / 75%)'

   positionSunLight()
   positionIss()
   renderer.render(scene, camera)
   requestAnimationFrame(render)
}

render()
