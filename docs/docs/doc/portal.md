# Portal

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
};
```