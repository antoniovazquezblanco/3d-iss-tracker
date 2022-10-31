import { Checkbox, h, HBox, Label, linkWithLabel, Slider, FlexSpring, VBox } from './dom'
import { MS_IN_DAY, MS_IN_HOUR, toInt } from './utils'

interface SettingsOverlayProps {
   ambientLightIntensity: number
   onAmbientLightIntensityChange(v: number): void

   sunLightIntensity: number
   onSunLightIntensityChange(v: number): void

   timeShift: number
   onTimeShiftChange(v: number): void

   axesVisible: boolean
   onAxesVisibleChange(v: boolean): void

   futureOrbit: number
   onFutureOrbitChange(v: number): void

   pastOrbit: number
   onPastOrbitChange(v: number): void
}

export function SettingsOverlay(props: SettingsOverlayProps) {
   const ambientLightControl = SettingSlider({
      label: 'Ambient Light',
      min: 0,
      max: 20,
      step: 0.01,
      initialValue: props.ambientLightIntensity,
      parseValue: parseFloat,
      onValueChange: props.onAmbientLightIntensityChange
   })

   const sunLightControl = SettingSlider({
      label: 'Sun Light',
      min: 0,
      max: 20,
      step: 0.01,
      initialValue: props.sunLightIntensity,
      parseValue: parseFloat,
      onValueChange: props.onSunLightIntensityChange
   })

   const timeShiftControl = SettingSlider({
      label: 'Time Shift',
      min: -12 * MS_IN_HOUR,
      max: 12 * MS_IN_HOUR,
      step: 1,
      initialValue: props.timeShift,
      parseValue: toInt,
      onValueChange: props.onTimeShiftChange
   })

   const futureOrbitControl = SettingSlider({
      label: 'Future Orbit',
      min: 0,
      max: MS_IN_DAY,
      step: 1,
      initialValue: props.futureOrbit,
      parseValue: toInt,
      onValueChange: props.onFutureOrbitChange
   })

   const pastOrbitControl = SettingSlider({
      label: 'Past Orbit',
      min: 0,
      max: MS_IN_DAY,
      step: 1,
      initialValue: props.pastOrbit,
      parseValue: toInt,
      onValueChange: props.onPastOrbitChange
   })

   const axesVisibleLabel = Label('Axes and Grid')

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
      ambientLightControl,
      sunLightControl,
      timeShiftControl,
      futureOrbitControl,
      pastOrbitControl,
      axesVisibleControl
   )

   return root
}

interface SettingSliderProps {
   label: string
   min: number
   max: number
   step: number
   initialValue: number
   parseValue: (v: string) => number
   onValueChange: (v: number) => void
}

function SettingSlider(props: SettingSliderProps) {
   const sliderLabel = Label(props.label)

   const sliderValue = h('div')
   sliderValue.textContent = '' + props.initialValue

   const slider = Slider(props.min, props.max, props.step)
   slider.value = '' + props.initialValue
   slider.oninput = () => {
      const newValue = props.parseValue(slider.value)
      sliderValue.textContent = '' + newValue
      props.onValueChange(newValue)
   }

   slider.ondblclick = sliderLabel.ondblclick = () => {
      sliderValue.textContent = slider.value = '' + props.initialValue
      props.onValueChange(props.initialValue)
   }
   linkWithLabel(slider, sliderLabel)

   const labelBox = HBox()
   labelBox.append(sliderLabel, FlexSpring(), sliderValue)

   const root = VBox()
   root.append(labelBox, slider)

   return root
}
