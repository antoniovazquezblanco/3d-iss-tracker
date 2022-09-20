export function SettingsOverlay(props) {
   const ambientLightSliderLabel = document.createElement('label')
   ambientLightSliderLabel.textContent = 'Ambient Light'

   const ambientLightSlider = Slider(0, 5, 0.1)
   ambientLightSlider.value = props.ambientLightIntensity
   ambientLightSlider.oninput = () => self.onAmbientLightIntensityChange(ambientLightSlider.value)

   ambientLightSlider.id = ambientLightSliderLabel.htmlFor = 'ambient-light-slider'

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
      ambientLightSlider
   )

   const self = {
      root,
      onAmbientLightIntensityChange: () => {}
   }

   return self
}

function Slider(min, max, step) {
   const slider = document.createElement('input')
   slider.type = 'range'
   slider.min = min
   slider.max = max
   slider.step = step
   return slider
}
