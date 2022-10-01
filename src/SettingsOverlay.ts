import { Checkbox, HBox, Label, linkWithLabel, Slider, VBox } from './dom'
import { MS_IN_HOUR } from './utils'

interface SettingsOverlayProps {
   ambientLightIntensity: number
   onAmbientLightIntensityChange(v: number): void
   timeShift: number
   onTimeShiftChange(v: number): void
   axesVisible: boolean
   onAxesVisibleChange(v: boolean): void
}

export function SettingsOverlay(props: SettingsOverlayProps) {
   const ambientLightSliderLabel = Label('Ambient Light')

   const ambientLightSlider = Slider(0, 5, 0.01)
   ambientLightSlider.value = '' + props.ambientLightIntensity
   ambientLightSlider.oninput = () => props.onAmbientLightIntensityChange(parseFloat(ambientLightSlider.value))
   linkWithLabel(ambientLightSlider, ambientLightSliderLabel)

   const timeShiftSliderLabel = Label('Time shift')

   const timeShiftSlider = Slider(-12 * MS_IN_HOUR, 12 * MS_IN_HOUR, 1)
   timeShiftSlider.value = '' + props.timeShift
   timeShiftSlider.oninput = () => props.onTimeShiftChange(parseInt(timeShiftSlider.value, 10))
   linkWithLabel(timeShiftSlider, timeShiftSliderLabel)

   const axesVisibleLabel = Label('Axes')

   const axesVisibleCheckbox = Checkbox()
   axesVisibleCheckbox.checked = props.axesVisible
   axesVisibleCheckbox.oninput = () => props.onAxesVisibleChange(axesVisibleCheckbox.checked)
   linkWithLabel(axesVisibleCheckbox, axesVisibleLabel)

   const axesVisibleControl = HBox()
   axesVisibleControl.append(axesVisibleLabel, axesVisibleCheckbox)

   const root = VBox()
   root.style.width = '400px'
   root.style.position = 'fixed'
   root.style.bottom = root.style.right = '8px'
   root.style.padding = '8px'
   root.style.borderRadius = '3px'
   root.style.fontSize = '15px'
   root.style.color = '#fff'
   root.style.backgroundColor = 'rgb(255 255 255 / 30%)'

   root.append(
      ambientLightSliderLabel,
      ambientLightSlider,
      timeShiftSliderLabel,
      timeShiftSlider,
      axesVisibleControl
   )

   return root
}
