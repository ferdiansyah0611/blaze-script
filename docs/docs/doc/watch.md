# Watch

Watch effect on state, context, and props.

```tsx
import { init } from "@blaze";

const Hello = function () {
    const { render, watch } = init(this);
	const statusProps = watch(["props.status"], (depend, val) => console.log(depend, val));
    render(
        () => (
            <div>
                <p>hello world</p>
            </div>
        )
    );
};
```

By default, watch listener automatic clear on unmount lifecycle. But if you want try clear manual, use methods `clear()`.

```tsx
statusProps.clear();
```
