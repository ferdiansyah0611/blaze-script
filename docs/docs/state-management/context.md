# Context

Like a state, but with context can listener in any component and have method action for scale application.

```tsx
import { context, init } from "@blaze";

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
    const { render, dispatch } = init(this);
    user(this);
    const autoBatch = true;
    render(
        () => (
            <div>
                <p>Hello World, {this.ctx.user.email}</p>
                <button onClick={() => dispatch("user.update", "member@gmail.com", autoBatch)}></button>
            </div>
        )
    );
};
```