import App, { render, init } from "@blaze";
import { makeRouter, page } from "@blaze.router";
// route
import Index from './route/Index'
import PageExample from './route/Page'
import NotFound from './route/404'

const MyApp = function () {
	init(this);

	render(
		() => (
			<>
				<div className="p-4">
					<div id="route"></div>
				</div>
			</>
		),
		this
	);
};

const app = new App("#app", MyApp, {
	dev: import.meta.env.DEV,
});
app.use(
	makeRouter("#route", {
		url: [
			page("/", Index),
			page("/page", PageExample),
			page("/page/:id", PageExample),
			page("", NotFound),
		],
	})
);
app.mount();