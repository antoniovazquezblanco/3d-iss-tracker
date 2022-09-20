export function SettingsOverlay(props) {
   const sliderLabel = document.createElement('label')
   sliderLabel.textContent = 'Ambient Light'

   const slider = document.createElement('input')
   slider.type = 'range'
   slider.value = props.ambientLightIntensity
   slider.min = 0
   slider.max = 5
   slider.step = 0.1
   slider.oninput = () => self.onAmbientLightIntensityChange(slider.value)

   slider.id = sliderLabel.htmlFor = 'ambient-light-slider'

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
      sliderLabel,
      slider
   )

   const self = {
      root,
      onAmbientLightIntensityChange: () => {}
   }

   return self
}
