import {
   AmbientLight,
   AxesHelper,
   Box3,
   BufferGeometry,
   CineonToneMapping,
   ConeGeometry,
   DirectionalLight,
   DodecahedronGeometry,
   GridHelper,
   Layers,
   Line,
   LineBasicMaterial,
   LineDashedMaterial,
   Material,
   MathUtils,
   Mesh,
   MeshBasicMaterial,
   MeshStandardMaterial,
   Object3D,
   PerspectiveCamera,
   Scene,
   ShaderMaterial,
   SphereGeometry,
   Vector2,
   Vector3,
   WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { getLatLngObj } from 'tle.js'
import { h } from './dom'
import { LocationPredictionOverlay } from './LocationPredictionOverlay'
import { SettingsOverlay } from './SettingsOverlay'
import {
   EARTH_DIAMETER_EQUATOR_KM,
   EARTH_RADIUS_AVG_KM,
   getIssTle,
   ISS_ALTITUDE_AVG_KM,
   latLngToVector3,
   loadGltfModel,
   MS_IN_DAY,
   MS_IN_HOUR,
   MS_IN_MINUTE,
   normalize,
   NULL_ISLAND,
   ORIGIN,
   rotateAroundPoint,
   ROTATION_PER_MS_DEG,
   Y_AXIS
} from './utils'

const { degToRad } = MathUtils

const enum SceneLayer {
   Default = 0,
   Bloom = 1
}

const renderer = new WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true })
renderer.physicallyCorrectLights = true
renderer.toneMapping = CineonToneMapping
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)

const scene = new Scene

const ambientLight = new AmbientLight(0xFFFFFF, 1)
scene.add(ambientLight)

const sunLight = new DirectionalLight(0xFFFFFF, 11)
scene.add(sunLight)

const axes = new AxesHelper(EARTH_DIAMETER_EQUATOR_KM)
axes.visible = false
scene.add(axes)

const grid = new GridHelper(20_000, 20)
grid.visible = false
scene.add(grid)

// TODO: Adjust FoV to avoid magnifying glass effect.
const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, Number.MAX_SAFE_INTEGER)
camera.position.setScalar(10_500)
camera.lookAt(ORIGIN)

// TODO...?
// const skyBoxGeometry = new SphereGeometry(Number.MAX_SAFE_INTEGER / 10_000, 512, 512)
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
orbitControls.minDistance = EARTH_DIAMETER_EQUATOR_KM * 0.55
orbitControls.maxDistance = EARTH_DIAMETER_EQUATOR_KM * 3

const vertexShader = `
varying vec2 vUv;

void main() {
   vUv = uv;
   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const fragmentShader = `
uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;

varying vec2 vUv;

void main() {
   gl_FragColor = texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv);
}`

const bloomLayer = new Layers
bloomLayer.set(SceneLayer.Bloom)

const renderScene = new RenderPass(scene, camera)

const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 4, 0.25, 0)

const bloomComposer = new EffectComposer(renderer)
bloomComposer.renderToScreen = false
bloomComposer.setSize(window.innerWidth, window.innerHeight) // TODO: Update on window resize.
bloomComposer.addPass(renderScene)
bloomComposer.addPass(bloomPass)

const finalPass = new ShaderPass(
   new ShaderMaterial({
      uniforms: {
         baseTexture: { value: null },
         bloomTexture: { value: bloomComposer.renderTarget2.texture }
      },
      vertexShader,
      fragmentShader,
      defines: {}
   }),
   'baseTexture'
)
finalPass.needsSwap = true

const finalComposer = new EffectComposer(renderer)
finalComposer.addPass(renderScene)
finalComposer.addPass(finalPass)

const frame = { time: Date.now() }
let timeShift = 0
let futureOrbit = 1.5 * MS_IN_HOUR
let pastOrbit = 1.5 * MS_IN_HOUR

function positionSunLight() {
   let lastNoon = new Date().setUTCHours(12, 0, 0, 0)
   if (lastNoon > frame.time) {
      lastNoon -= MS_IN_DAY
   }

   const msFromLastNoon = frame.time - lastNoon
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
   const model = gltf.scene
   const box = new Box3().setFromObject(model)
   const center = box.getCenter(new Vector3)

   model.position.x += model.position.x - center.x
   model.position.y += model.position.y - center.y
   model.position.z += model.position.z - center.z
   model.scale.setScalar(EARTH_DIAMETER_EQUATOR_KM / 1_000)
   rotateAroundPoint(model, ORIGIN, Y_AXIS, degToRad(-90))

   scene.remove(tempEarthSphere)
   scene.add(model)
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
// TODO: Improve cone–sphere intersection.
const issBeamGeometry = new ConeGeometry(1_800, ISS_ALTITUDE_AVG_KM + 300, 256, 1, true)
const issBeamMaterial = new MeshStandardMaterial({ color: 0x11ff11, transparent: true, opacity: 0.25 })
const issBeam = new Mesh(issBeamGeometry, issBeamMaterial)
issBeam.geometry.rotateX(degToRad(-90))
scene.add(issBeam)

loadGltfModel('assets/iss-lossy.glb').then(gltf => {
   const model = gltf.scene
   model.scale.setScalar(issScale)
   scene.remove(tempIssBox)
   issObject = model
   scene.add(model)
})

// TODO: Apply glowing and/or fading effect.
const issFutureOrbitMaterial = new LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9 })
const issFutureOrbitGeometry = new BufferGeometry
const issFutureOrbitLine = new Line(issFutureOrbitGeometry, issFutureOrbitMaterial)
issFutureOrbitLine.layers.enable(SceneLayer.Bloom)
scene.add(issFutureOrbitLine)

const issPastOrbitMaterial = new LineDashedMaterial({ color: 0xff00ff, transparent: true, opacity: 0.9, gapSize: 500, dashSize: 500 })
const issPastOrbitGeometry = new BufferGeometry
const issPastOrbitLine = new Line(issPastOrbitGeometry, issPastOrbitMaterial)
issPastOrbitLine.layers.enable(SceneLayer.Bloom)
scene.add(issPastOrbitLine)

function positionIss() {
   if (!issObject) return

   const { lat, lng } = getLatLngObj(issTle, frame.time)
   // TODO: Position at exact altitude.
   const radius = 6_371 + ISS_ALTITUDE_AVG_KM
   issObject.position.copy(latLngToVector3(lat, lng, radius))
   issObject.lookAt(ORIGIN)
   issBeam.position.copy(latLngToVector3(lat, lng, radius - issBeamGeometry.parameters.height / 2))
   issBeam.lookAt(ORIGIN)

   const issFuturePoints: Vector3[] = []
   for (let i = 1; i <= futureOrbit; i += MS_IN_MINUTE) {
      const { lat, lng } = getLatLngObj(issTle, frame.time + i)
      issFuturePoints.push(latLngToVector3(lat, lng, radius))
   }
   issFutureOrbitGeometry.setFromPoints(issFuturePoints)

   const issPastPoints: Vector3[] = []
   for (let i = 1; i <= pastOrbit; i += MS_IN_MINUTE) {
      const { lat, lng } = getLatLngObj(issTle, frame.time - i)
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

const locationPredictionOverlay = LocationPredictionOverlay({
   canvas: renderer.domElement,
   earth: tempEarthSphere,
   camera,
   frame,
   issTle
})

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

const timeDisplay = h('div')
timeDisplay.style.userSelect = 'none'
timeDisplay.style.position = 'fixed'
timeDisplay.style.bottom = timeDisplay.style.left = '8px'
timeDisplay.style.fontSize = '14px'
timeDisplay.style.color = 'rgb(255 255 255 / 75%)'
timeDisplay.style.textShadow = '0 0 5px rgb(255 255 255 / 50%)'

document.body.style.margin = '0'
document.body.style.fontFamily = 'system-ui, sans-serif'
document.body.style.backgroundImage = 'radial-gradient(#123, #000)'
document.body.style.accentColor = '#343d46'
document.body.append(locationPredictionOverlay, settingsOverlay, timeDisplay, renderer.domElement)

window.addEventListener('resize', () => {
   const { innerWidth, innerHeight } = window

   camera.aspect = innerWidth / innerHeight
   camera.updateProjectionMatrix()

   renderer.setSize(innerWidth, innerHeight)
   bloomComposer.setSize(innerWidth, innerHeight)
   finalComposer.setSize(innerWidth, innerHeight)
})

const materials: Record<string, Material> = {}
const darkMaterial = new MeshBasicMaterial({ color: 'black' })

function darkenNonBloomed(obj: Object3D) {
   if (obj instanceof Mesh && !bloomLayer.test(obj.layers)) {
      materials[obj.uuid] = obj.material
      obj.material = darkMaterial
   }
}

function restoreMaterial(obj: Object3D) {
   if (materials[obj.uuid]) {
      (obj as Mesh).material = materials[obj.uuid]
      delete materials[obj.uuid]
   }
}

function render() {
   frame.time = Date.now() + timeShift

   timeDisplay.textContent = new Date(frame.time).toISOString().slice(0, -5) + 'Z'
   timeDisplay.style.color = timeShift > 0
      ? 'rgb(255 100 100 / 75%)'
      : timeShift < 0
      ? 'rgb(255 100 255 / 75%)'
      : 'rgb(255 255 255 / 75%)'

   positionSunLight()
   positionIss()

   const controlsDistance = orbitControls.getDistance()
   const controlsMinDistance = orbitControls.minDistance
   const controlsMaxDistance = orbitControls.maxDistance
   orbitControls.rotateSpeed = normalize(controlsDistance, controlsMinDistance, controlsMaxDistance, 0.02, 1)
   orbitControls.zoomSpeed = normalize(controlsDistance, controlsMinDistance, controlsMaxDistance, 0.25, 1)

   scene.traverse(darkenNonBloomed)
   bloomComposer.render()
   scene.traverse(restoreMaterial)

   finalComposer.render()

   requestAnimationFrame(render)
}

render()
