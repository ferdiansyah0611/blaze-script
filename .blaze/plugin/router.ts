import { EntityRender } from "@root/system/core";
import { mount } from "@blaze";
import { Component } from "@root/blaze.d";
import { App, Router } from "@root/system/global";

class EntityRouter {
	app: any;
	config: any;
	tool: any;
	constructor(app, config, tool) {
		this.app = app;
		this.config = config;
		this.tool = tool;
	}
	static change(app: any, request: string) {
		app.$router.$change.forEach((item) => item(request));
	}
	static found(app, url) {
		let msg = `[Router] GET 200 ${url}`;
		app.$router._found(msg);
	}
	static gotoNotFound(app, config, url, goto) {
		let current = config.url.find(
			(path) => path.path.length === 0 || (config.auto && path.path.indexOf("/404") !== -1)
		);
		let msg = `[Router] Not Found 404 ${url}`;
		app.$router._error(msg);
		goto(app, url, current.component, {});
		return;
	}
	handling(url: string, popstate: boolean) {
		if (popstate) {
			history.replaceState(null, "", url);
		} else {
			history.pushState(null, "", url);
		}
		popstate = false;
	}
	beforeEach(config: any): boolean {
		if (config && config.beforeEach) {
			if (!config.beforeEach(this.app.$router)) {
				return false;
			}
			return true;
		}
		return true;
	}
	afterEach(config: any): boolean {
		if (config && config.afterEach) {
			if (!config.afterEach(this.app.$router)) {
				return this.app.$router.back();
			}
		}
		return true;
	}
	setSearch(search: string, config: any) {
		if (config.search) {
			let searchparam = {};
			for (const [key, value] of new URLSearchParams(search).entries()) {
				searchparam[key] = value;
			}
			Object.assign(this.app, {
				search: searchparam,
			});
		} else {
			delete this.app.search;
		}
	}
	removePrevious() {
		let check = this.app.$router.history.at(0);
		if (check && check.current && check.current.$deep) check.current.$deep.remove();
		this.app.$router.history = this.app.$router.history.filter((data, i) => {
			data;
			i !== 0;
		});
	}
	add(url: string, current: Component) {
		this.app.$router.history.push({ url, current });
	}
	inject(component: Component) {
		component.$router = this.tool;
	}
}

/**
 * @makeRouter
 * extension for router
 */
export const makeRouter = (entry: string, config: any, dev: boolean = false) => {
	let tool;
	let popstate = false;
	let keyApplication = 0;
	let glob = {};
	let isCustomize;
	const mappingConfig = (item) => {
		if (config.config && config.config[item.path]) {
			item.config = config.config[item.path];
		}
	};

	if (!config.url) config.url = [];
	if (config.customize && config.customize.render) isCustomize = true;
	// auto route
	if (config.auto && !isCustomize) {
		if (dev) {
			Object.assign(glob, import.meta.glob("@app/test.dev/route/*.tsx"));
			Object.assign(glob, import.meta.glob("@app/test.dev/route/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@app/test.dev/route/**/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@app/test.dev/route/**/**/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@app/test.dev/route/**/**/**/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@app/test.dev/route/**/**/**/**/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@app/test.dev/route/**/**/**/**/**/**/*.tsx"));
		} else {
			Object.assign(glob, import.meta.glob("@route/*.tsx"));
			Object.assign(glob, import.meta.glob("@route/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@route/**/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@route/**/**/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@route/**/**/**/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@route/**/**/**/**/**/*.tsx"));
			Object.assign(glob, import.meta.glob("@route/**/**/**/**/**/**/*.tsx"));
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
	} else if (config.auto && !isCustomize) {
		config.url.map(mappingConfig);
	}
	/**
	 * @goto
	 * run component and append to entry query
	 */
	const goto = async (
		app: any,
		url: string,
		component: any,
		configure: any,
		params?: any,
		search?: any,
		entity?: any
	) => {
		if (!document.querySelector(entry)) {
			let msg = "[Router] entry not found, query is correct?";
			app.$router._error(msg);
			return console.error(msg);
		}
		let current;
		if (entity) {
			entity.handling(url, popstate);
			entity.setSearch(search, configure);
		}

		const callComponent = (request) => {
			current = new EntityRender(request, {
				arg: [Object.assign(app, { params }), App.get(keyApplication, 'app')],
				key: keyApplication,
			});
		};
		// auto route or not
		if (component.name.indexOf("../") !== -1) {
			// loader
			const loader = new EntityRender(app.$router.loader, {});
			loader
				.start()
				.compile({
					first: true,
					deep: null,
				})
				.appendChild(document.body)
				.mount(app.$router.hmr);

			let check = await component();
			if (check.default) {
				callComponent(check.default);
			}
			loader.remove(true, false);
		} else {
			callComponent(component);
		}

		current
			.start()
			.compile({
				first: true,
				deep: null,
			})
			.replaceChildren(entry)
			.mount(app.$router.hmr)
			.saveToExtension()
			.done(function () {
				if (entity) {
					entity.removePrevious();
					entity.add(url, this.component);
					entity.inject(this.component);
					entity.afterEach(configure);
				}
			});
	};

	/**
	 * @ready
	 * utils for check url is exists or not
	 */
	const ready = (app: any, uri: any = new URL(location.href)) => {
		let url = uri.pathname;

		if (config.customize && config.customize.render) {
			return config.customize.render(url, {
				check,
				page,
				entry,
				keyApplication,
				app,
				EntityRouter,
				popstate,
				tool,
				config,
			});
		}

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
					EntityRouter.gotoNotFound(app, config, url, goto);
					return false;
				}
			}
			if ((!result.config.search && uri.search) || (result.config.search && !uri.search)) {
				return EntityRouter.gotoNotFound(app, config, url, goto);
			}

			const entity = new EntityRouter(app, config, tool);

			if (!entity.beforeEach(result.config)) return false;

			EntityRouter.change(app, url);
			EntityRouter.found(app, url);

			return goto(app, url, result.component, result.config, params, uri.search, entity);
		} else {
			return EntityRouter.gotoNotFound(app, config, url, goto);
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
					ready(app, url);
				}
			},
			onChange(data) {
				let check = this.$change.find((item) => item.toString() === data.toString());
				if (!check) {
					this.$change.push(data);
				}
			},
			_error(error) {
				this.error.forEach((data) => data(error));
			},
			_found(message) {
				this.found.forEach((data) => data(message));
			},
		};
		app.$router = tool;
		let current = Router.get(keyApp)
		if (!current) {
			Router.set(tool)
		}
		keyApplication = keyApp;

		/**
		 * @onMakeElement
		 * on a element and dataset link is router link
		 */
		blaze.onMakeElement.push((el: any) => {
			if (el && el.nodeName === "A" && el.dataset.link && el.href !== "#" && !el.$router) {
				if (config.resolve) {
					let url = new URL(el.href);
					el.dataset.href = url.origin + config.resolve + (url.pathname === "/" ? "" : url.pathname);
					// search
					if (url.search) {
						el.dataset.href += url.search;
					}
					el.href = el.dataset.href;
				}
				el.$router = true;
				el.addEventListener("click", (e: any) => {
					e.preventDefault();
					tool.push(new URL(config.resolve ? e.currentTarget.dataset.href : el.href));
				});
			}
		});

		/**
		 * @onMakeComponent
		 * inject router to always component
		 */
		blaze.onMakeComponent.push((component) => {
			component.$router = tool;
		});

		/**
		 * @onReload
		 * hot reload
		 */
		blaze.onReload.push((updateComponent: any[]) => {
			updateComponent.forEach((newComponent) => {
				let component = app.$router.history.at(0).current;
				let loader = app.$router.loader;
				let createApp = App.get(keyApp);
				if (createApp.isComponent(newComponent)) {
					if (newComponent.name === component.constructor.name) {
						createApp.componentProcess({ component, newComponent, key: 0 });
					}
					if (newComponent.name === loader.name) {
						Object.assign(app.$router, {
							loader: newComponent,
						});
					}
				}
			});
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
export const startIn = (component: Component, keyApp?: number, loader?: Function) => {
	if (!(typeof keyApp === "number")) {
		keyApp = 0;
	}

	mount(() => {
		let router = component.$router
		router.loader = loader;

		if (!router.hmr) {
			router.ready(component);
			window.addEventListener("popstate", () => {
				router.popstate = true;
				router.ready(component, location);
			});
		} else {
			router.popstate = true;
			router.ready(component, location);
		}
	}, component);
};

export const page = (path: string, component: any, config: any = {}) => ({
	path,
	component,
	config,
});
