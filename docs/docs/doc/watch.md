# Watch

Watch effect on state, context, and props.

```tsx
import { watch } from "@blaze";

watch(["state.status"], (depend, value) => console.log(depend, value), this);
watch(["props.status"], (depend, value) => console.log(depend, value), this);
```