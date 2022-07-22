# Blaze Documentation

## Example Code

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
            <div>
                <p>{this.state.name}</p>
            </div>
        ),
        this
    );
};
```

## Lifecycle & Batching

```tsx
import { init } from "@blaze";

const Hello = function () {
    const { state, mount, render, layout, beforeUpdate, updated } = init(this);
    state("state", {
        name: "ferdiansyah",
        now: 0,
        data: ["hi", "hi", "hi"],
    });
    // always call on rendering
    layout(() => {
        console.log("layout effect");
    });
    // call before state/context change
    beforeUpdate(() => {
        console.log("before update");
    });
    // call after state/context change
    updated(() => {
        console.log("after update");
    });
    // DOM is ready
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
            // unmount
            clearInterval(interval);
        };
    });
    render(() => (
        <>
            <p>
                Interval {this.state.now} {this.ctx.user.email}
            </p>
        </>
    ));
};
```

## Watching State & Prop

```tsx
import { watch } from "@blaze";

watch(["state.tatus"], (a, b) => console.log(a, b), this);
watch(["props.status"], (a, b) => console.log(a, b), this);
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

By default, event listener is auto batching and async. If you want disable auto batch, try add attribute `batch={false}` on current element where have event listener.

```tsx
import { init, render } from "@blaze";

const Hello = function () {
    init(this);
    let click = (e) => {
        console.log("clicked");
    };
    render(
        () => (
            <div>
                <button onClick={click}>Click Me</button>
                <input onChangeValue={(value) => console.log(value)} type="text" />
                <a href="/" onClickPrevent={click}>
                    Click Me
                </a>
            </div>
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

## List Rendering

Support jsx map array to render.

```tsx
<div>
    {this.state.user.map((item: any) => (
        <div>
            <p>{item.username}</p>
        </div>
    ))}
</div>
```

In the blaze, use attribute "for" at parent and attribute "key" at children to customize map data without replacing children on updating data array.

```tsx
<div for>
    {this.state.user.map((item: any) => (
        <div key={item.id}>
            <p>{item.username}</p>
        </div>
    ))}
</div>
```

## Skip Diffing For Performance (Optional)

If node not interaction with state, you can skip diff with property "d".

```tsx
<div d>
    <p>{this.state.name}</p>
</div>
```

## Shorthand Code

You can use modular function in init.

Supporting function in init

-   mount
-   layout
-   dispatch
-   render
-   batch
-   state
-   watch

```tsx
import App, { init } from "@blaze";

const Hello = function () {
    const { render, mount, layout, state } = init(this);
    state("mystate", {
        id: 1,
    });
    mount(() => console.log("mount"));
    layout(() => console.log("layout"));
    render(() => (
        <div>
            <p>Hello World</p>
        </div>
    ));
};
const app = new App("#app", Hello, {
    dev: import.meta.env.DEV,
});
app.mount();
```

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

## Access Children

```tsx
<>
    <div>{this.children}</div>
</>
```

## About Attributes

```tsx
<section>
    <div style="display: none;"></div>
    <div style={{ display: "none" }}></div>
    <div class="flex"></div>
    <div className="flex"></div>
    {/*auto join*/}
    <div className={["flex", "justify-center"]}></div>

    <div show={true}>
        <p>I'm show element</p>
    </div>
    <button toggle="state.open">toggle</button>
    <section setHTML="<p>Hello World</p>"></section>

    <div class="text-white">
        <p if={true}>true</p>
        <p else>false</p>
    </div>
</section>
```

## Portal Component

a component but node render appendChild to body element.

```tsx
import { createPortal } from "@root/render";

const portalApp = function () {
    const { render } = init(this);
    createPortal(this);
    render(() => (
        <div>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vitae corrupti, blanditiis explicabo in quis
                tenetur quas magnam autem fugit corporis atque praesentium deserunt harum minus iste, reprehenderit,
                dolores commodi! A.
            </p>
        </div>
    ));
};

const MyApp = function () {
    const { render } = init(this);
    render(() => (
        <div>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vitae corrupti, blanditiis explicabo in quis
                tenetur quas magnam autem fugit corporis atque praesentium deserunt harum minus iste, reprehenderit,
                dolores commodi! A.
            </p>
            <portalApp />
            <portalApp key={2} />
            <portalApp key={3} show={false} />
        </div>
    ));
}
```

## Multiple App

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
    key: 0
});
const app2 = new createApp("#app-2", Hello, {
    dev: import.meta.env.DEV,
    key: 1
});
app.mount();
app2.mount();
```

## Remove Component Manual (Optional)

```tsx
this.$deep.remove();
```