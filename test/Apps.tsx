import App, { render, state, init, mount, batch, dispatch } from "@blaze";
import { makeRouter, page } from "@blaze.router";
// route
import Home from "./route/Home";
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

const app = new App("#app", TestApp, {
	// dev: import.meta.env.DEV,
	dev: false,
});
app.use(
	makeRouter("#route", {
		resolve: "/test/index.html",
		url: [
			page("/", Index),
			page("/home", Home),
			page("/blog/:id", Show),
			page("", NotFound)
		],
	})
);
app.mount();
