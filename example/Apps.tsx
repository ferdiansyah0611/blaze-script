import { render, state, init, mount, batch, dispatch } from "@blaze";
import { createApp } from '@root/render';
import { makeRouter, page, startIn } from "@blaze.router";
// route
import About from "./route/About";
import Index from "./route/Index";
import Show from "./route/Show";
import NotFound from "./route/404";
// component
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";

const TestApp = function () {
	init(this);
	startIn(this);

	render(
		() => (
			<>
				<div d>
					<Navbar />
					<div d id="route"></div>
					<Footer />
				</div>
			</>
		),
		this
	);
};

const app = new createApp("#app", TestApp, {
	dev: false,
});
export default function Run(){
	app.use(
		makeRouter("#route", {
			resolve: "/example/index.html",
			url: [page("/", Index), page("/about", About), page("/blog/:id", Show), page("", NotFound)],
		})
	);
	app.mount();

	return app;
};