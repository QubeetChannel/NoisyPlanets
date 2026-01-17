import { reactive } from 'vue'

const settings = reactive({
  seed: 42,
  amplitude: 0.5,
  frequency: 10,
  radius: 1,
  colors: [
    { color: '#ffffff', position: 1 },
    { color: '#666666', position: .75 },
    { color: '#32cd32', position: .55 },
    { color: '#ffe600', position: .25 },
    { color: '#3b4cc0', position: 0 },
  ]
})

export default function useSettings() {
  return { settings }
}