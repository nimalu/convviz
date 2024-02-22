import { createUniqueId } from "solid-js"
import "./NumberInput.css"

type props = { value: number, onchange: (newValue: number) => void, label: string }
export default function NumberInput({ value, onchange, label }: props) {
    const id = createUniqueId()

    return <div class="number-input-wrapper">
        <label for={id}> {label} </label>
        <input type="number" value={value} id={id} onchange={el => onchange(Number.parseInt(el.target.value))} />
    </div>
}