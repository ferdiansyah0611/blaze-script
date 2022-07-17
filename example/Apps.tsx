import App, { render, state, init, mount, batch, dispatch } from "@blaze";
import { makeRouter, page } from "@blaze.router";
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

const Run = () => {
	const app = new App("#app", TestApp, {
		// dev: import.meta.env.DEV,
		dev: false,
	});
	app.use(
		makeRouter("#route", {
			resolve: "/example/index.html",
			url: [page("/", Index), page("/about", About), page("/blog/:id", Show), page("", NotFound)],
		})
	);
	app.mount();

	return app;
};

export default Run;
