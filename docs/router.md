# Router

## Create

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