# Multiple App

Can run multiple app in one website.

```tsx
import { init, render } from "@blaze";
import { createApp } from "@root/render";

const Hello = function (prevComponent, rootApp) {
    init(this);
    render(
        () => (
            <div>
                <p>Hello World</p>
            </div>
        ),
        this
    );
};
const app = new createApp("#app", Hello, {
    dev: import.meta.env.DEV,
    key: 0,
});
const app2 = new createApp("#app-2", Hello, {
    dev: import.meta.env.DEV,
    key: 1,
});
app.mount();
app2.mount();
```