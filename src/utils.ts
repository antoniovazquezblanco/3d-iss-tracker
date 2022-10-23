import { MathUtils, Object3D, Vector3 } from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { LatLngObject } from 'tle.js'

const { sqrt, sin, cos, acos, atan2 } = Math
const { degToRad, radToDeg } = MathUtils

export const MS_IN_MINUTE = 60 * 1_000
export const MS_IN_HOUR = 60 * MS_IN_MINUTE
export const MS_IN_DAY = 24 * MS_IN_HOUR

export const ORIGIN = new Vector3(0, 0, 0)
export const Y_AXIS = new Vector3(0, 1, 0)
export const NULL_ISLAND = new Vector3(0, 0, -Number.MAX_SAFE_INTEGER)

// TODO: Adjust based on https://en.m.wikipedia.org/wiki/World_Geodetic_System.
export const EARTH_RADIUS_AVG_KM = 6_371
export const EARTH_DIAMETER_POLES_KM = 12_714
export const EARTH_DIAMETER_EQUATOR_KM = 12_756
export const ISS_ALTITUDE_AVG_KM = 420

export const SUN_RADIUS_KM = 696_340
export const EARTH_TO_SUN_KM = 149_730_000

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
   const phi = degToRad(90 - lat)
   const theta = degToRad(lng + 180)
   return new Vector3(
      -radius * sin(phi) * cos(theta),
      radius * cos(phi),
      radius * sin(phi) * sin(theta)
   )
}

export function latLngFromVector3(pos: Vector3): LatLngObject {
   const lat = 90 - radToDeg(acos(pos.y / EARTH_RADIUS_AVG_KM))
   const lng = ((90 + radToDeg(atan2(pos.x , pos.z))) % 360) - 180
   return { lat, lng }
}

export function latLngDistanceKm(p1: LatLngObject, p2: LatLngObject) {
   const latDiff = degToRad(p2.lat - p1.lat)
   const lngDiff = degToRad(p2.lng - p1.lng)
   const a = sin(latDiff / 2) ** 2 + cos(degToRad(p1.lat)) * cos(degToRad(p2.lat)) * sin(lngDiff / 2) ** 2
   const c = 2 * atan2(sqrt(a), sqrt(1 - a))
   return c * EARTH_RADIUS_AVG_KM
}

export function normalize(value: number, oldMin: number, oldMax: number, newMin: number, newMax: number) {
   return (newMax - newMin) * ((value - oldMin) / (oldMax - oldMin)) + newMin
}

interface TleJson {
   name: string
   line1: string
   line2: string
   satelliteId: number
   date: string
}

export function getIssTle() {
   return fetch('https://tle.ivanstanojevic.me/api/tle/49044')
      .then(res => res.json())
      .then((tle: TleJson) => `${tle.name}\n${tle.line1}\n${tle.line2}`)
}

const gltfLoader = new GLTFLoader
const fbxLoader = new FBXLoader

export function loadGltfModel(filename: string) {
   return new Promise<GLTF>((resolve, reject) =>
      gltfLoader.load(filename, resolve, noop, reject)
   )
}

export function loadFbxModel(filename: string) {
   return new Promise<Object3D>((resolve, reject) =>
      fbxLoader.load(filename, resolve, noop, reject)
   )
}
