# State

```tsx
import { init } from "@blaze";

const Hello = function () {
    const { render, state } = init(this);
    state(
        null,
        {
            name: "ferdiansyah",
        }
    );
    
    const change = () => this.state.name = "safina sahda"

    render(() => <p>{this.state.name}</p>);
};
```

Make a state with different name.

```tsx
state("user", { name: "safina sahda" });
console.log(this.user.name);
```