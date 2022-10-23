export const h = document.createElement.bind(document)

export function Label(text: string) {
   const label = h('label')
   label.textContent = text
   return label
}

export function linkWithLabel(input: HTMLInputElement, label: HTMLLabelElement) {
   label.htmlFor = input.id = (input.id || crypto.randomUUID())
}

export function Slider(min: number, max: number, step: number) {
   const slider = h('input')
   slider.type = 'range'
   slider.min = '' + min
   slider.max = '' + max
   slider.step = '' + step
   return slider
}

export function Checkbox() {
   const checkbox = h('input')
   checkbox.type = 'checkbox'
   return checkbox
}

export function VBox(gap = 0) {
   const box = h('div')
   box.style.display = 'flex'
   box.style.flexDirection = 'column'
   box.style.gap = gap + 'px'
   return box
}

export function HBox(gap = 0) {
   const box = h('div')
   box.style.display = 'flex'
   box.style.flexDirection = 'row'
   box.style.gap = gap + 'px'
   return box
}
