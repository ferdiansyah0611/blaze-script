import { render, init } from "@blaze";
import { createApp } from '@root/render';
import { makeRouter, page, startIn } from "@blaze.router";
// route
import Index from './route/Index'
import PageExample from './route/Page'
import NotFound from './route/404'

const MyApp = function () {
	init(this);
	startIn(this);

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

const app = new createApp("#app", MyApp, {
	dev: import.meta.env.DEV,
});

export default function Apps() {
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

	return app;
}