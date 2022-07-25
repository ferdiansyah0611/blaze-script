# Batch

To prevent re-rendering on change multiple state, you can use batch function

```tsx
import { init } from "@blaze";

const Hello = function () {
    const { state, render, batch } = init(this);
    state("state", {
        name: "ferdiansyah",
        click: 0,
    });
    const click = () => batch(() => {
    	this.state.name = "safina sahda"
    	this.state.click++
    })
    render(() => (
        <div>
            <p>hi, {this.state.name}</p>
            <button onClick={click}>show name</button>
        </div>
    ));
};
```