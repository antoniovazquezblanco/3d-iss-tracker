import { toInt } from './utils'

interface SettingsOverlayProps {
   ambientLightIntensity: number
   onAmbientLightIntensityChange: (v: number) => {}
   timeShift: number
   onTimeShiftChange: (v: number) => {}
}

export function SettingsOverlay(props: SettingsOverlayProps) {
   const ambientLightSliderLabel = Label('Ambient Light')

   const ambientLightSlider = Slider(0, 5, 0.1)
   ambientLightSlider.value = '' + props.ambientLightIntensity
   ambientLightSlider.oninput = () => props.onAmbientLightIntensityChange(toInt(ambientLightSlider.value))

   const timeShiftSliderLabel = Label('Time shift')

   const timeShiftSlider = Slider(-12, 12, 0.1)
   timeShiftSlider.value = '' + props.timeShift
   timeShiftSlider.oninput = () => props.onTimeShiftChange(toInt(timeShiftSlider.value))

   const root = document.createElement('div')
   root.style.display = 'flex'
   root.style.flexDirection = 'column'
   root.style.position = 'fixed'
   root.style.top = '8px'
   root.style.right = '8px'
   root.style.padding = '8px'
   root.style.borderRadius = '4px'
   root.style.fontSize = '15px'
   root.style.color = '#fff'
   root.style.backgroundColor = 'rgb(0 255 0 / 25%)'

   root.append(
      ambientLightSliderLabel,
      ambientLightSlider,
      timeShiftSliderLabel,
      timeShiftSlider
   )

   return root
}

function Label(text: string) {
   const label = document.createElement('label')
   label.textContent = text
   return label
}

function Slider(min: number, max: number, step: number) {
   const slider = document.createElement('input')
   slider.type = 'range'
   slider.min = '' + min
   slider.max = '' + max
   slider.step = '' + step
   return slider
}
