export function Label(text: string) {
   const label = document.createElement('label')
   label.textContent = text
   return label
}

export function linkWithLabel(input: HTMLInputElement, label: HTMLLabelElement) {
   label.htmlFor = input.id = (input.id || crypto.randomUUID())
}

export function Slider(min: number, max: number, step: number) {
   const slider = document.createElement('input')
   slider.type = 'range'
   slider.min = '' + min
   slider.max = '' + max
   slider.step = '' + step
   return slider
}

export function Checkbox() {
   const checkbox = document.createElement('input')
   checkbox.type = 'checkbox'
   return checkbox
}

export function VBox() {
   const box = document.createElement('div')
   box.style.display = 'flex'
   box.style.flexDirection = 'column'
   return box
}

export function HBox() {
   const box = document.createElement('div')
   box.style.display = 'flex'
   box.style.flexDirection = 'row'
   return box
}
