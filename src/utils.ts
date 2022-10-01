import { MathUtils, Object3D, Vector3 } from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export const MS_IN_HOUR = 60 * 60 * 1_000
export const MS_IN_DAY = 24 * MS_IN_HOUR

export const ORIGIN = new Vector3(0, 0, 0)
export const Y_AXIS = new Vector3(0, 1, 0)
export const NULL_ISLAND = new Vector3(0, 0, -Number.MAX_SAFE_INTEGER)

// TODO: Adjust based on https://en.m.wikipedia.org/wiki/World_Geodetic_System.
export const EARTH_RADIUS_AVG_KM = 6_371
export const EARTH_DIAMETER_POLES_KM = 12_714
export const EARTH_DIAMETER_EQUATOR_KM = 12_756
export const ISS_AVG_ALTITUDE_KM = 420

export const ROTATION_PER_MS_DEG = 360 / MS_IN_DAY

export function noop() {}

export function rotateAroundPoint(obj: Object3D, point: Vector3, axis: Vector3, rotationRad: number) {
   obj.position.sub(point)
   obj.position.applyAxisAngle(axis, rotationRad)
   obj.position.add(point)
   obj.rotateOnAxis(axis, rotationRad)
}

// TODO: Adjust based on WGS 84.
export function latLngToVector3(lat: number, lng: number, radius: number) {
   const phi = MathUtils.degToRad(90 - lat)
   const theta = MathUtils.degToRad(lng + 180)
   return new Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
   )
}

interface TleJson {
   name: string
   line1: string
   line2: string
   satelliteId: number
   date: string
}

export function getIssTle() {
   return fetch('https://tle.ivanstanojevic.me/api/tle/25544')
      .then(res => res.json())
      .then((tle: TleJson) => `ISS (ZARYA)\n${tle.line1}\n${tle.line2}`)
}

const gltfLoader = new GLTFLoader
const fbxLoader = new FBXLoader

export function loadGltfModel(filename: string) {
   return new Promise<GLTF>((resolve, reject) =>
      gltfLoader.load('models/' + filename, resolve, noop, reject)
   )
}

export function loadFbxModel(filename: string) {
   return new Promise<Object3D>((resolve, reject) =>
      fbxLoader.load('models/' + filename, resolve, noop, reject)
   )
}
