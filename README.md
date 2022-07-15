# Blaze Script

Virtual DOM For Single Page Application using Vite & Typescript.

## Feature

-   Virtual DOM
-   State Management
-   Lifecycle
-   Include Router and Context
-   JSX Syntax
-   Batch

## Get Started

```tsx
import App, { init, render } from "@blaze";

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
import { init, state, render } from "@blaze";

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
import { init, state, mount, render } from "@blaze";

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
        return () => {
            clearInterval(interval);
        };
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
import { watch } from "@blaze";

watch(["state.tatus"], (a, b) => console.log(a, b), this);
watch(["props.status"], (a, b) => console.log(a, b), this);
```

## Logical (Optional)

You can use logical in jsx or this logical.

```tsx
<>
    <div if={this.state.now > 2}>
        <Example status={this.state.now} key={1} />
    </div>
    <div data-name={this.state.name} if={this.state.now === 5}>
        <p>Done</p>
    </div>
    <div else>
        <p>Please Wait...</p>
    </div>
</>
```

## Context

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

## Refs

```tsx
import { init, render } from "@blaze";

const Hello = function () {
    init(this);
    render(
        () => (
            <>
                {/*access refs with this.hi*/}
                <p refs="hi">Hello World</p>
                {/*array refs. access with this.text[i]*/}
                <p refs="text" i={0}>
                    Hello World
                </p>
                <p refs="text" i={1}>
                    Hello World
                </p>
            </>
        ),
        this
    );
};
```

## Event

```tsx
import { init, render } from "@blaze";

const Hello = function () {
    init(this);
    let click = (e) => {
        console.log("clicked");
    };
    render(
        () => (
            <>
                <button onClick={click}>Click Me</button>
                <input onChangeValue={(value) => console.log(value)} type="text" />
                <a href="/" onClickPrevent={click}>
                    Click Me
                </a>
            </>
        ),
        this
    );
};
```

## Model Input

Auto handling input with max 5 deep object and can trigger manually.

```tsx
<div>
    <input type="text" model="state.name" trigger={0} placeholder="Name" />
    <input type="text" model="state.sub.name" trigger={1} placeholder="Name" />
    <input type="text" model="state.sub.sub2.name" trigger={1} placeholder="Name" />
    <input type="text" model="state.sub.sub2.sub3.name" trigger={1} placeholder="Name" />
</div>
```

## Skip Diffing For Performance (Optional)

If node not interaction with state, you can skip diff with property "d".

```tsx
<>
    <div d>
        <p>{this.state.name}</p>
    </div>
</>
```

## Fragment JSX Only For Use First Element On Component

Work 100%

```tsx
<>
    <p>{this.state.name}</p>
<>
```

Don't work

```tsx
<>
    <p>{this.state.name}</p>
    <>
        <p>I'm children</p>
    </>
<>
```

## Router API

### Create

```tsx
// import it
import { makeRouter, page } from "@blaze.router";

app.use(
    makeRouter("#route", {
        url: [page("/", Index), page("/test", Test), page("/test/:id", TestParam), page("", NotFound)],
        // option for resolve url
        resolve: "/test/index.html",
    })
);
app.mount();
```

### Params

```tsx
const TestParam = function (app) {
    init(this);
    render(
        () => (
            <>
                <p>{app.params.id}</p>
            </>
        ),
        this
    );
};
```

### Method

```tsx
const history = this.$router.history;

history.push("/home");
history.back();
history.go(-2);
```

## Extension API (Plugin)

Extension tools for view component, performance, log, console, etc.

### Setup

```tsx
import { withExtension } from "@root/plugin/extension";

app.use(withExtension("#extension", import.meta.env.DEV));
```

## Helmet API (Plugin)

Helmet tools for title and description meta.

### Get Started

```tsx
import helmet from "@root/plugin/helmet";

helmet({
    title: "Hello World",
    description: "lorem ipsum",
});
```

## More Info

-   Updating TextNode Only Work In /SPAN|P|H1|H2|H3|H4|H5|H6|A|BUTTON/
-   Component must be have a key props if more than one
-   SVG work but if not work in anycase, add element property svg=""

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
