# Context

Like a state, but with context can listener in any component and have method action for scale application.

```tsx
import { context, init, render, dispatch } from "@blaze";

const user = context(
    "user",
    {
        email: "admin@gmail.com",
    },
    {
        update(state, data) {
            state.email = data;
        },
    }
);

const Hello = function () {
    init(this);
    user(this);
    const autoBatching = true;
    render(
        () => (
            <>
                <p>Hello World, {this.ctx.user.email}</p>
                <button onClick={() => dispatch("user.update", this, "member@gmail.com", autoBatching)}></button>
            </>
        ),
        this
    );
};
```