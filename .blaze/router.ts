import { mountCall } from "./core";
import { getBlaze } from "./utils";
import { mount, batch } from "@blaze";
import { Component } from "./blaze.d";
import { addLog, addComponent } from "@root/plugin/extension";

/**
 * @makeRouter
 * extension for router
 */
export const makeRouter = (entry: string, config: any) => {
	let tool;
	let popstate = false;
	if(config.resolve) {
		config.url.map((item) => {
			if (item.path) {
				item.path = config.resolve + (item.path === "/" ? "" : item.path);
			}
		});
	}

	/**
	 * @goto
	 * run component and append to entry query
	 */
	const goto = (app: any, url: string, component: any, config: any, params?: any) => {
		if (!document.querySelector(entry)) {
			let msg = "[Router] entry not found, query is correct?";
			addLog({ msg });
			return console.error(msg);
		}

		const replaceOrPush = () => {
			if (popstate) {
				history.replaceState(null, "", url);
			} else {
				history.pushState(null, "", url);
			}
			popstate = false;
		}

		replaceOrPush()

		let old = performance.now(),
			now,
			duration,
			msg;
		let current = new component(Object.assign(app, { params }));
		// props registery
		current.$node = current.render();
		current.$node.render = false;

		// inject router
		current.$router = tool;

		getBlaze().runEveryMakeComponent(current);
		mountCall(current.$deep, {}, true);
		let query = document.querySelector(entry);
		Array.from(query.children).forEach(item => item.remove());
		query.append(current.$node);
		app.$router.history.forEach((data) => {
			data.current.$deep.remove();
		});
		app.$router.history.push({ url, current });
		// timer
		now = performance.now();
		duration = (now - old).toFixed(1);
		msg = `[${component.name}] ${duration}ms`;
		current.$deep.time = duration;
		// extension
		batch(() => {
			addLog({ msg }, false);
			addComponent(current, false);
		}, window.$extension);

		// afterEach
		if(config && config.afterEach) {
			if(!config.afterEach(app.$router)) {
				return app.$router.back();
			}
		}
	};

	/**
	 * @ready
	 * utils for check url is exists or not
	 */
	const ready = (app: any, first: boolean = false, url: string = new URL(location.href).pathname) => {

		let routes = config.url.find((v: any) => v.path === url),
			component: string = "",
			params: any = {},
			found: any;

		const validation = () => {
			if (routes) {
				component = routes.component;
				found = routes;
				return true;
			} else {
				const pathRegex = (path: string) =>
					new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");
				const potentialMatched = config.url.map((route: any) => {
					return {
						route,
						result: url.match(pathRegex(route.path)),
					};
				});
				let match = potentialMatched.find((potentialMatch: any) => potentialMatch.result !== null);
				if (!match) {
					if (routes) {
						match = {
							route: routes[0],
							result: [url],
						};
					} else {
						let current = config.url.find((path) => path.path.length === 0);
						component = current.component;
						found = current;
						let msg = `[Router] Not Found 404 ${url}`;
						addLog({ msg });
						goto(app, url, component, {});
						return false;
					}
				}
				const getParams = (match: any) => {
					const values = match.result.slice(1);
					const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map((result: any) => result[1]);
					return Object.fromEntries(
						keys.map((key: any, i: number) => {
							return [key, values[i]];
						})
					);
				};
				params = getParams(match);
				found = match.route;
				return true;
			}
		};

		if (validation()) {
			// beforeEach
			if(found && found.config.beforeEach) {
				if(!found.config.beforeEach(app.$router)) {
					return false
				}
			}

			// call always change router
			if (!first) window.$app.$router.$change.forEach((item) => item());
			// remove previous router
			if(app.$router.history.length) {
				removeCurrentRouter(app)
			}

			let msg = `[Router] GET 200 ${url}`;
			addLog({ msg });
			return goto(app, url, found.component, found.config, params);
		}
	};
	return (app: Component, blaze, hmr) => {
		/**
		 * inject router to current component
		 */
		tool = {
			$change: [],
			history: [],
			go(goNumber: number) {
				history.go(goNumber);
			},
			back: () => {
				history.back();
			},
			push: (url: string) => {
				if (!(url === location.pathname)) {
					ready(app, false, url);
				}
			},
			onChange(data) {
				this.$change.push(data);
			},
		};
		// remove previous router
		if(window.$router && window.$router.history.length) {
			removeCurrentRouter(window)
		}
		app.$router = tool;
		window.$router = tool;

		/**
		 * @onMakeElement
		 * on a element and dataset link is router link
		 */
		blaze.onMakeElement = (el: any) => {
			if (el && el.nodeName === "A" && el.dataset.link && !el.isRouter && el.href !== "#") {
				if (config.resolve) {
					let url = new URL(el.href);
					el.dataset.href = url.origin + config.resolve + (url.pathname === "/" ? "" : url.pathname);
				}
				el.addEventListener("click", (e: any) => {
					e.preventDefault();
					tool.push(new URL(config.resolve ? e.currentTarget.dataset.href : el.href).pathname);
				});
				el.isRouter = true;
			}
		};

		/**
		 * @onMakeComponent
		 * inject router to always component
		 */
		blaze.onMakeComponent = (component) => {
			component.$router = tool;
		};

		/**
		 * @mount
		 * mount on current component and add event popstate
		 */
		mount(() => {
			if (!hmr) {
				ready(app, true);
				window.addEventListener("popstate", () => {
					popstate = true;
					ready(app, false, location.pathname);
				});
			} else {
				popstate = true;
				ready(app, false, location.pathname);
			}
		}, app);
	};
};
export const page = (path: string, component: any, config: any = {}) => ({
	path,
	component,
	config,
});

const removeCurrentRouter = (app) => {
	app.$router.history.at(0).current.$deep.remove()
	app.$router.history = app.$router.history.filter((data, i) => {
		data
		i !== 0
	})
}