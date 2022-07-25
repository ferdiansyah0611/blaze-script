# Short Code

You can use modular function in init.

Supporting function in init

-   beforeCreate
-   created
-   mount
-   beforeUpdate
-   updated
-   layout
-   dispatch
-   render
-   batch
-   state
-   watch
-   computed

## Short

```tsx
import App, { init } from "@blaze";

const App = function () {
    const { render, mount, layout, state } = init(this);
    state("mystate", {
        id: 1,
    });
    mount(() => console.log("mount"));
    layout(() => console.log("layout"));
    render(() => <p>Hello World</p>);
};
```

## Modular

But with modular always parsing the argument "this"

```tsx
import App, { init, render, mount, layout, state } from "@blaze";

const Hello = function () {
    init(this);
    state(
        "mystate",
        {
            id: 1,
        },
        this
    );
    mount(() => console.log("mount"), this);
    layout(() => console.log("mount"), this);
    render(() => <p>Hello World</p>, this);
};
```