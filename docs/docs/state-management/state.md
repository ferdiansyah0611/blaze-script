# State

```tsx
import { init } from "@blaze";

const Hello = function () {
    const { render, state } = init(this);
    state(
        "state",
        {
            name: "ferdiansyah",
        }
    );
    
    const change = () => this.state.name = "safina sahda"

    render(() => <p>{this.state.name}</p>);
};
```