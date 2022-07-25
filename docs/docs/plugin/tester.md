# Tester

Testing component with tester, but extension plugin must be active.

```tsx
import { withExtension } from "@root/plugin/extension";
import Tester, { withTest } from "@root/plugin/tester";
//...Apps.tsx
const testing = (to) => {
	to("NameComponent", (component) => {
		const { describe, it, query, data, result, done } = new Tester(component);
		describe("Event Handle", () => {
			it("Next Page", () => {
				query('[data-test="1"]').event("click").expect("innerText", "Next");
				data("ctx.blog.page").toBe(2).sameType("number");
			});
		});
		done();
	});
};

app.use(withExtension("#extension", import.meta.env.DEV));
if (import.meta.env.DEV) {
	app.use(withTest(testing));
}
```
