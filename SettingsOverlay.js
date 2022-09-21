export function SettingsOverlay(props) {
   const ambientLightSliderLabel = Label('Ambient Light')

   const ambientLightSlider = Slider(0, 5, 0.1)
   ambientLightSlider.value = props.ambientLightIntensity
   ambientLightSlider.oninput = () => self.onAmbientLightIntensityChange(ambientLightSlider.value)

   ambientLightSlider.id = ambientLightSliderLabel.htmlFor = 'ambient-light-slider'

   const timeShiftSliderLabel = Label('Time shift')

   const timeShiftSlider = Slider(-12, 12, 0.1)
   timeShiftSlider.value = props.timeShift
   timeShiftSlider.oninput = () => self.onTimeShiftChange(timeShiftSlider.value)

   timeShiftSlider.id = timeShiftSliderLabel.htmlFor = 'time-shift-slider'

   const root = document.createElement('div')
   root.style.display = 'flex'
   root.style.flexDirection = 'column'
   root.style.position = 'fixed'
   root.style.top = '8px'
   root.style.right = '8px'
   root.style.padding = '8px'
   root.style.borderRadius = '4px'
   root.style.color = '#fff'
   root.style.backgroundColor = 'rgb(0 255 0 / 25%)'

   root.append(
      ambientLightSliderLabel,
      ambientLightSlider,
      timeShiftSliderLabel,
      timeShiftSlider
   )

   const self = {
      root,
      onAmbientLightIntensityChange: () => {},
      onTimeShiftChange: () => {}
   }

   return self
}

function Label(text) {
   const label = document.createElement('label')
   label.textContent = text
   return label
}

function Slider(min, max, step) {
   const slider = document.createElement('input')
   slider.type = 'range'
   slider.min = min
   slider.max = max
   slider.step = step
   return slider
}
