# Event

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