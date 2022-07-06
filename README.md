# Blaze Script
Virtual DOM For Single Page Application using Vite & Typescript.
## Feature
- Virtual DOM
- State Management
- Lifecycle
- Include Router and Context
- JSX
- Batch

## Get Started
```tsx
const Hello = function () {
    init(this);
    render(
        () => (
            <>
                <p>Hello World</p>
            </>
        ),
        this
    );
};
const app = new App("#app", Hello, {
    dev: import.meta.env.DEV,
});
app.mount();
```
## State Management
```tsx
const Hello = function () {
    init(this);
    state(
        "state",
        {
            name: "ferdiansyah"
        },
        this
    );
    render(
        () => (
            <>
                <p>{this.state.name}</p>
            </>
        ),
        this
    );
}
```
## Lifecycle
```tsx
const Hello = function () {
    init(this);
    state(
        "state",
        {
            name: "ferdiansyah",
            now: 0,
            data: ["hi", "hi", "hi"],
        },
        this
    );
    mount(() => {
        let interval = setInterval(() => {
            batch(() => {
                this.state.name = "safina " + this.state.now;
                this.state.now += 1;
                if (this.state.now === 5) {
                    clearInterval(interval);
                }
            }, this);
        }, 2000);
    }, this);
    render(() => <>
        <p>Interval {this.state.now} {this.ctx.user.email}</p>
    </>, this)
}
```
## Watching State & Prop
```tsx
watch(["state.tatus"], (a, b) => console.log(a, b), this);
watch(["props.status"], (a, b) => console.log(a, b), this);
```
# Router API
## Create
```tsx
// import it
import { makeRouter, page } from "@blaze.router";

app.use(
    makeRouter("#route", {
        url: [
            page("/", Hello),
            page("/test", Hello2),
            page("/test/:id", Hello2),
            page("", NotFound),
        ],
    })
);
app.mount();
```
## Method
```tsx
app.history.push('/home')
app.history.back()
app.history.go(-2)
```