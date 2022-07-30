import { rendering } from "@root/core";
import { mount } from "@blaze";
import { Component } from "@root/blaze.d";
import { addComponent } from "@root/plugin/extension";

/**
 * @makeRouter
 * extension for router
 */
export const makeRouter = (entry: string, config: any, dev: boolean = false) => {
	let tool;
	let popstate = false;
	let keyApplication = 0;
	let glob = {};
	const mappingConfig = (item) => {
		if (config.config && config.config[item.path]) {
			item.config = config.config[item.path];
		}
	};

	if (!config.url) config.url = [];

	// auto route
	if (config.auto) {
		if (dev) {
			Object.assign(glob, import.meta.glob("@app/test.dev/route/*.tsx"));
			Object.assign(glob, import.meta.glob("@app/test.dev/route/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@app/test.dev/route/**/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@app/test.dev/route/**/**/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@app/test.dev/route/**/**/**/**/*.tsx"));
		} else {
			Object.assign(glob, import.meta.glob("@route/*.tsx"));
			Object.assign(glob, import.meta.glob("@route/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@route/**/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@route/**/**/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@route/**/**/**/**/*.tsx"));
		}
		for (let modules in glob) {
			let path = modules.split(dev ? "../../test.dev/route" : "../../src/route")[1].toLowerCase();
			if (path.match(".tsx")) {
				let url = path.split(".tsx")[0];
				url = url.replaceAll("[", ":").replaceAll("]", "");
				if (url.indexOf("index") !== -1) {
					url = url.split("index")[0];
					if (url.endsWith("/") && url.length > 1) {
						url = url.replace(/\/$/, "");
					}
				}
				config.url.push(page(url, glob[modules]));
			}
		}
	}
	if (config.resolve) {
		config.url.map((item) => {
			mappingConfig(item);

			if (item.path) {
				item.path = config.resolve + (item.path === "/" ? "" : item.path);
			}
		});
	} else if (config.auto) {
		config.url.map(mappingConfig);
	}

	/**
	 * @goto
	 * run component and append to entry query
	 */
	const goto = async (app: any, url: string, component: any, config: any, params?: any, search?: any) => {
		if (!document.querySelector(entry)) {
			let msg = "[Router] entry not found, query is correct?";
			app.$router._error(msg);
			return console.error(msg);
		}
		let current;

		const replaceOrPush = () => {
			if (popstate) {
				history.replaceState(null, "", url);
			} else {
				history.pushState(null, "", url);
			}
			popstate = false;
		};

		replaceOrPush();

		// search
		if (config.search) {
			let searchparam = {};
			for (const [key, value] of new URLSearchParams(search).entries()) {
				searchparam[key] = value;
			}
			Object.assign(app, {
				search: searchparam,
			});
		} else {
			delete app.search;
		}

		// auto route or not
		if (component.name.indexOf("../") !== -1) {
			current = await component();
			if (current.default) {
				current = new current.default(Object.assign(app, { params }), window.$app[keyApplication]);
			}
		} else {
			current = new component(Object.assign(app, { params }), window.$app[keyApplication]);
		}

		if (window.$app) {
			current.$config = window.$app[keyApplication].$config;
		}
		// render
		rendering(current, null, true, {}, 0, current.constructor, []);
		const query = document.querySelector(entry);
		Array.from(query.children).forEach((item) => item.remove());
		query.append(current.$node);
		current.$deep.mounted(false);
		addComponent(current);

		app.$router.history.forEach((data) => {
			data.current.$deep.remove();
		});

		app.$router.history.push({ url, current });
		// inject router
		current.$router = tool;

		// afterEach
		if (config && config.afterEach) {
			if (!config.afterEach(app.$router)) {
				return app.$router.back();
			}
		}
	};

	/**
	 * @ready
	 * utils for check url is exists or not
	 */
	const ready = (app: any, first: boolean = false, uri: any = new URL(location.href)) => {
		let url = uri.pathname;

		const goNotFound = () => {
			let current = config.url.find(
				(path) => path.path.length === 0 || (config.auto && path.path.indexOf("/404") !== -1)
			);
			let msg = `[Router] Not Found 404 ${url}`;
			app.$router._error(msg);
			goto(app, url, current.component, {});
		};

		const { result, isValid, params } = check(config, url);

		if (isValid) {
			// search
			if (uri.search) url += uri.search;
			if (result.config.search && uri.search) {
				let searchNotEqual;

				result.config.search.forEach((search) => {
					if (uri.search.indexOf(search) === -1) {
						searchNotEqual = true;
					}
				});

				if (searchNotEqual) {
					goNotFound();
					return false;
				}
			}
			if ((!result.config.search && uri.search) || (result.config.search && !uri.search)) {
				return goNotFound();
			}

			// beforeEach
			if (result && result.config.beforeEach) {
				if (!result.config.beforeEach(app.$router)) {
					return false;
				}
			}

			// call always change router
			if (!first) app.$router.$change.forEach((item) => item());
			// remove previous router
			if (app.$router.history.length) {
				removeCurrentRouter(app.$router);
			}

			let msg = `[Router] GET 200 ${url}`;
			app.$router._found(msg);
			return goto(app, url, result.component, result.config, params, uri.search);
		} else {
			goNotFound();
			return false;
		}
	};
	return (app: Component, blaze, hmr, keyApp) => {
		/**
		 * inject router to current component
		 */
		tool = {
			$change: [],
			history: [],
			error: [],
			found: [],
			ready,
			popstate,
			hmr,
			go(goNumber: number) {
				history.go(goNumber);
			},
			back: () => {
				history.back();
			},
			push: (url: URL) => {
				if ((url.search && url.search !== location.search) || !(url.pathname === location.pathname)) {
					ready(app, false, url);
				}
			},
			onChange(data) {
				this.$change.push(data);
			},
			_error(error) {
				this.error.forEach((data) => data(error));
			},
			_found(message) {
				this.found.forEach((data) => data(message));
			},
		};
		// remove previous router
		if (window.$router && window.$router[keyApp].history.length) {
			removeCurrentRouter(window.$router[keyApp]);
		}
		app.$router = tool;
		if (!window.$router) {
			window.$router = [];
		}
		window.$router[keyApp] = tool;
		keyApplication = keyApp;

		/**
		 * @everyMakeElement
		 * on a element and dataset link is router link
		 */
		blaze.everyMakeElement.push((el: any) => {
			if (el && el.nodeName === "A" && el.dataset.link && !el.isRouter && el.href !== "#") {
				if (config.resolve) {
					let url = new URL(el.href);
					el.dataset.href = url.origin + config.resolve + (url.pathname === "/" ? "" : url.pathname);
					// search
					if (url.search) {
						el.dataset.href += url.search;
					}
				}
				el.addEventListener("click", (e: any) => {
					e.preventDefault();
					tool.push(new URL(config.resolve ? e.currentTarget.dataset.href : el.href));
				});
				el.isRouter = true;
			}
		});

		/**
		 * @everyMakeComponent
		 * inject router to always component
		 */
		blaze.everyMakeComponent.push((component) => {
			component.$router = tool;
		});
	};
};

/**
 * @check
 * check potential match on route with url
 */
function check(config: any, url: string) {
	let result, isValid, params;
	let routes = config.url.find((v: any) => v.path === url);

	if (routes) {
		isValid = true;
		result = routes;
	} else {
		const pathRegex = (path: string) => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");
		const potentialMatched = config.url.map((route: any) => {
			return {
				route,
				result: url.match(pathRegex(route.path)),
			};
		});
		let match = potentialMatched.find((potentialMatch: any) => potentialMatch.result !== null);
		if (!match) {
			isValid = false;
			return { result, isValid };
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
		isValid = true;
		params = getParams(match);
		result = match.route;
	}

	return { result, isValid, params };
}

/**
 * @mount
 * mount on current component and add event popstate
 */
export const startIn = (component: Component, keyApp?: number) => {
	if (!(typeof keyApp === "number")) {
		keyApp = 0;
	}

	mount(() => {
		if (!window.$router[keyApp].hmr) {
			window.$router[keyApp].ready(component, true);
			window.addEventListener("popstate", () => {
				window.$router[keyApp].popstate = true;
				window.$router[keyApp].ready(component, false, location);
			});
		} else {
			window.$router[keyApp].popstate = true;
			window.$router[keyApp].ready(component, false, location);
		}
	}, component);
};

export const page = (path: string, component: any, config: any = {}) => ({
	path,
	component,
	config,
});

const removeCurrentRouter = ($router) => {
	$router.history.at(0).current.$deep.remove();
	$router.history = $router.history.filter((data, i) => {
		data;
		i !== 0;
	});
};
