# Router

Plugin for routing a page

## Setup

```tsx
import { makeRouter, page, startIn } from "@root/plugin/router";

const App = function () {
    const { render } = init(this);
    // add, where #route in component
    startIn(this);
    render(() => <div>
        <div id="route"></div>
    </div>)
}
// ...
app.use(
    makeRouter("#route", {
        url: [page("/", Index), page("/test", Test, {
            // if false, component not run and not push/replace url
            beforeEach(router){
                // router.go(-1)
                // etc...
                return true
            },
            // if false, auto redirect back
            afterEach(router){
                return true
            }
        }), page("/test/:id", TestParam), page("", NotFound)],
        // option for resolve url
        resolve: "/test/index.html",
    })
);
app.mount();
```

## Auto Route

Auto route based on files in route folder with max 4 folder path. Example:

```text
index.tsx   => /
404.tsx     => ""
[id].tsx    => /:id

/admin/index.tsx    => /admin
/admin/[id].tsx     => /admin/:id

/admin/page/example/test/index.tsx  => /admin/page/example/test
```

```tsx
app.use(
    makeRouter("#route", {
        auto: true,
        // optional (config for route)
        config: {
            '/': {
                beforeEach(){
                    return true
                }
            }
        }
    })
);
```

Change page

```tsx
<a href="/home" data-link>Home</a>
```

## Params

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

## Method

```tsx
const history = this.$router.history;

history.push("/home");
history.back();
history.go(-2);
```