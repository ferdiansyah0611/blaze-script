# Blaze Script

Virtual DOM For Single Page Application using Vite & Typescript.

## Feature

-   Virtual DOM
-   State Management
-   Lifecycle
-   Include Router and Context
-   JSX
-   Batch

## Get Started

```tsx
import App, { init, render } from '@blaze';

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
import { init, state, render } from '@blaze';

const Hello = function () {
    init(this);
    state(
        "state",
        {
            name: "ferdiansyah",
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
};
```

## Lifecycle & Batching

```tsx
import { init, state, mount, render } from '@blaze';

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
    render(
        () => (
            <>
                <p>
                    Interval {this.state.now} {this.ctx.user.email}
                </p>
            </>
        ),
        this
    );
};
```

## Watching State & Prop

```tsx
import { watch } from '@blaze';

watch(["state.tatus"], (a, b) => console.log(a, b), this);
watch(["props.status"], (a, b) => console.log(a, b), this);
```

## Logical
Recommendation Because Work 100% Like This

```tsx
<>
    <div if={this.state.now > 2}>
        <Example props={{ status: this.state.now }} />
    </div>
    <div data-name={this.state.name} if={this.state.now === 5}>
        <p>Done</p>
    </div>
    <div else>
        <p>Please Wait...</p>
    </div>
</>
```
But This Don't Work
```tsx
<>
    {
        this.state.now > 2 && <Example props={{ status: this.state.now }} />
    }
    {
        this.state.now === 5 ?
        <div data-name={this.state.name} if={this.state.now === 5}>
            <p>Done</p>
        </div>
        :
        <div else>
            <p>Please Wait...</p>
        </div>
    }
</>
```
Work 100% Logical JSX In TextNode Or Property
```tsx
<>
    <p className={this.state.now === 0 ? "hidden" : "block"}>Lorem {this.state.now === 10 ? "ipsum" : "consectetur"}</p>
</>
```

## Context
```tsx
import { context, init, render } from "@blaze";

const user = context("user", {
    email: "admin@gmail.com",
});

const Hello = function () {
    init(this);
    user(this)
    render(
        () => (
            <>
                <p>Hello World, {this.ctx.user.email}</p>
            </>
        ),
        this
    );
};
```
## Refs
```tsx
import { refs, init, render } from "@blaze";

const Hello = function () {
    init(this);
    refs("hi", this);
    refs("text", this, true);
    render(
        () => (
            <>
                <p refs="hi">Hello World</p>
                {/*array refs*/}
                <p refs="text" i={0}>Hello World</p>
                <p refs="text" i={1}>Hello World</p>
            </>
        ),
        this
    );
};
```
## Event
```tsx
import { refs, init, render } from "@blaze";

const Hello = function () {
    init(this);
    let click = (e) => {
        console.log('clicked')
    }
    render(
        () => (
            <>
                <button onClick={click}>Click Me</button>
                <a href="/" onClickPrevent={click}>Click Me</a>
            </>
        ),
        this
    );
};
```

# Router API

## Create

```tsx
// import it
import { makeRouter, page } from "@blaze.router";

app.use(
    makeRouter("#route", {
        url: [
            page("/", Index),
            page("/test", Test),
            page("/test/:id", TestParam),
            page("", NotFound),
        ],
    })
);
app.mount();
```

## Method

```tsx
const history = this.$router.history;

history.push("/home");
history.back();
history.go(-2);
```
