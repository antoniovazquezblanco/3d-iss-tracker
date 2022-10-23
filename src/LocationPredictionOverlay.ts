import { Camera, Object3D, Raycaster, Vector2 } from 'three'
import { getLatLngObj, LatLngObject } from 'tle.js'
import { h, VBox } from './dom'
import { latLngFromVector3, latLngDistanceKm, MS_IN_DAY, MS_IN_MINUTE } from './utils'

interface LocationPredictionOverlayProps {
   canvas: HTMLCanvasElement
   earth: Object3D
   camera: Camera
   issTle: string,
   frame: { time: number }
}

interface IssPrediction {
   time: number
   kmToIss: number
}

const rayCaster = new Raycaster

function latLngFromMouseEvent(ev: MouseEvent, canvas: HTMLCanvasElement, camera: Camera, earth: Object3D) {
   const canvasRect = canvas.getBoundingClientRect()

   const mousePosition = new Vector2
   mousePosition.x = ((ev.clientX - canvasRect.left) / canvas.width) * 2 - 1
   mousePosition.y = -((ev.clientY - canvasRect.top) / canvas.height) * 2 + 1

   rayCaster.setFromCamera(mousePosition, camera)

   const intersects = rayCaster.intersectObjects([earth])
   if (intersects.length === 0) {
      return
   }

   return latLngFromVector3(intersects[0].point)
}

export function LocationPredictionOverlay(props: LocationPredictionOverlayProps) {
   let enableLocationSelection = false
   let latLng: LatLngObject | undefined

   window.addEventListener('click', () => {
      enableLocationSelection = false
      enableLocationSelectionBtn.disabled = false
   })

   props.canvas.addEventListener('mousemove', ev => {
      if (!enableLocationSelection) {
         return
      }

      latLng = latLngFromMouseEvent(ev, props.canvas, props.camera, props.earth)
      if (!latLng) {
         return
      }

      locationPredictionsLatLng.hidden = false
      locationPredictionsLatLng.style.color = '#bbb'
      locationPredictionsLatLng.textContent = `Latitude: ${latLng.lat.toFixed(6)}, longitude: ${latLng.lng.toFixed(6)}`
   })

   props.canvas.addEventListener('click', () => {
      if (!enableLocationSelection || !latLng) {
         return
      }

      const frameTime = new Date(props.frame.time)
      frameTime.setSeconds(0)
      frameTime.setMilliseconds(0)

      let time = frameTime.getTime()
      const predictions: IssPrediction[] = []
      let promisingPrediction: IssPrediction | undefined
      while (true) {
         time += MS_IN_MINUTE
         const issLatLng = getLatLngObj(props.issTle, time)
         const kmToIss = latLngDistanceKm(latLng, issLatLng)
         if (promisingPrediction) {
            if (kmToIss < promisingPrediction.kmToIss) {
               promisingPrediction = { time, kmToIss }
            } else {
               predictions.push(promisingPrediction)
               promisingPrediction = undefined
            }
            continue
         } else {
            promisingPrediction = { time, kmToIss }
         }
         if (time - props.frame.time > 30 * MS_IN_DAY) {
            break
         }
      }

      locationPredictionsTableBody.innerHTML = ''

      const filteredPredictions = predictions
         .sort((a, b) => a.kmToIss - b.kmToIss)
         .slice(0, 5)
         .sort((a, b) => a.time - b.time)

      if (filteredPredictions.length > 0) {
         locationPredictionsTable.hidden = false
      }

      for (const p of filteredPredictions) {
         const timeCell = h('td')
         timeCell.textContent = new Date(p.time).toISOString().replace('T', ' ').slice(0, -8)
         timeCell.style.padding = '2px 8px'

         const distanceCell = h('td')
         distanceCell.textContent = p.kmToIss.toFixed(2)
         distanceCell.style.textAlign = 'right'
         distanceCell.style.padding = '2px 8px'

         const row = h('tr')
         row.append(timeCell, distanceCell)

         locationPredictionsTableBody.append(row)
      }

      locationPredictionsLatLng.style.color = ''
   })

   const locationPredictionsTitle = h('h1')
   locationPredictionsTitle.textContent = 'Location Predictions'
   locationPredictionsTitle.style.margin = '0'
   locationPredictionsTitle.style.fontSize = '16px'
   locationPredictionsTitle.style.fontWeight = 'normal'

   const enableLocationSelectionBtn = h('button')
   enableLocationSelectionBtn.textContent = '🎯 Select Earth location'
   enableLocationSelectionBtn.onclick = ev => {
      ev.stopPropagation()
      enableLocationSelection = true
      enableLocationSelectionBtn.disabled = true
   }

   const locationPredictionsLatLng = h('div')
   locationPredictionsLatLng.hidden = true

   const locationPredictionsTableHeadTimeCol = h('th')
   locationPredictionsTableHeadTimeCol.textContent = 'Time (UTC)'
   locationPredictionsTableHeadTimeCol.style.padding = '2px 8px'
   locationPredictionsTableHeadTimeCol.style.textAlign = 'left'

   const locationPredictionsTableHeadDistanceCol = h('th')
   locationPredictionsTableHeadDistanceCol.textContent = 'Distance (km)'
   locationPredictionsTableHeadDistanceCol.style.padding = '2px 8px'
   locationPredictionsTableHeadDistanceCol.style.textAlign = 'right'

   const locationPredictionsTableHeadRow = h('tr')
   locationPredictionsTableHeadRow.append(locationPredictionsTableHeadTimeCol, locationPredictionsTableHeadDistanceCol)

   const locationPredictionsTableHead = h('thead')
   locationPredictionsTableHead.append(locationPredictionsTableHeadRow)

   const locationPredictionsTableBody = h('tbody')
   locationPredictionsTableBody.style.fontFamily = 'monospace'

   const locationPredictionsTable = h('table')
   locationPredictionsTable.hidden = true
   locationPredictionsTable.style.margin = '0 auto'
   locationPredictionsTable.append(locationPredictionsTableHead, locationPredictionsTableBody)

   const root = VBox(8)
   root.style.width = '310px'
   root.style.position = 'fixed'
   root.style.top = root.style.right = '8px'
   root.style.textAlign = 'center'
   root.style.padding = '8px'
   root.style.borderRadius = '3px'
   root.style.fontSize = '15px'
   root.style.color = '#fff'
   root.style.backgroundColor = 'rgb(255 255 255 / 30%)'

   root.append(
      locationPredictionsTitle,
      enableLocationSelectionBtn,
      locationPredictionsLatLng,
      locationPredictionsTable
   )

   return root
}
