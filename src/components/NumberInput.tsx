import { createUniqueId, splitProps } from "solid-js"
import "./NumberInput.css"

type props = { value: number, onchange: (newValue: number) => void, label: string }
export default function NumberInput(props: props) {
    const [local, _] = splitProps(props, ["value", "onchange", "label"])
    const id = createUniqueId()

    return <div class="number-input-wrapper">
        <label for={id}> {local.label} </label>
        <div class="number-input-control">
            <input value={local.value} id={id} onchange={el => local.onchange(Number.parseInt(el.target.value))} />
            <div>
                <button onclick={() => local.onchange(local.value + 1)}>+</button>
                <button onclick={() => local.onchange(local.value - 1)}>-</button>
            </div>
        </div>
    </div>
}