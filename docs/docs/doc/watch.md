# Watch

Watch effect on state, context, and props.

```tsx
import { watch } from "@blaze";

const statusState = watch(["state.status"], (depend, value) => console.log(depend, value), this);
const statusProps = watch(["props.status"], (depend, value) => console.log(depend, value), this);
```

By default, watch listener automatic clear on unmount lifecycle. But if you want try clear manual, use methods `clear()`.

```tsx
statusState.clear();
statusProps.clear();
```