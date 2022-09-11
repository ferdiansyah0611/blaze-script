import { EntityRender } from "@root/system/core";
import { mount } from "@blaze";
import { Component } from "@root/blaze.d";
import { App, Router, HMR } from "@root/system/global";

var firstPage = true;
var popstate = false;

class EntityRouter {
	app: any;
	config: any;
	tool: any;
	constructor(app, config, tool) {
		this.app = app;
		this.config = config;
		this.tool = tool;
	}
	static change(request: string, tool) {
		tool.$.change.forEach((item) => item(request));
	}
	static found(url, tool) {
		let msg = `[Router] GET 200 ${url}`;
		tool.run.found(msg);
	}
	static gotoNotFound(app, config, url, goto, tool) {
		let current = config.url.find(
			(path) => path.path.length === 0 || (config.auto && path.path.indexOf("/404") !== -1)
		);
		let msg = `[Router] Not Found 404 ${url}`;
		tool.run.error(msg);
		if (current) {
			goto(app, url, current.component, {});
		} else {
			console.warn("[notice] component for 404 pages is empty.");
		}
		return;
	}
	handling(url: string) {
		if (firstPage) {
			firstPage = false;
			return;
		}
		if (popstate) {
			history.replaceState(null, "", url);
			popstate = false;
			return;
		} else {
			history.pushState(null, "", url);
		}
	}
	beforeEach(config: any): boolean {
		if (config && config.beforeEach) {
			if (!config.beforeEach(this.tool)) {
				return false;
			}
			return true;
		}
		return true;
	}
	afterEach(config: any): boolean {
		if (config && config.afterEach) {
			if (!config.afterEach(this.tool)) {
				return this.tool.back();
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
		let check = this.tool.$.active;
		if (check && check.$deep) check.$deep.remove();
		this.tool.$.active = null;
	}
	add(component: Component) {
		this.tool.$.active = component;
	}
	inject(component: Component) {
		if (!component.$router) {
			component.$router = this.tool;
		}
	}
}

/**
 * @makeRouter
 * extension for router
 */
export const makeRouter = (entry: string, config: any) => {
	let tool;
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
		glob = import.meta.glob([
			"@route/*.tsx",
			"@route/**/*.tsx",
			"@route/**/**/*.tsx",
			"@route/**/**/**/*.tsx",
			"@route/**/**/**/**/*.tsx",
			"@route/**/**/**/**/**/*.tsx",
			"@route/**/**/**/**/**/**/*.tsx",
		]);

		for (let modules in glob) {
			let path = modules.split("/src/route")[1].toLowerCase();
			if (path.match(".tsx") && !path.startsWith("/_")) {
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
		entity?: any,
		nested?: any
	) => {
		if (!document.querySelector(entry)) {
			let msg = "[Router] entry not found, query is correct?";
			tool.run.error(msg);
			return console.error(msg);
		}
		let current;
		if (entity) {
			entity.handling(url);
			entity.setSearch(search, configure);
		}

		const callComponent = (request) => {
			current = new EntityRender(request, {
				arg: [Object.assign(app, { params }), App.get(keyApplication, "app")],
				key: keyApplication,
			});
		};
		// auto route or not
		if (component.name.indexOf("/src") !== -1) {
			// loader
			let loader;
			if (tool.loader) {
				loader = new EntityRender(tool.loader, {});
				loader
					.start()
					.compile({
						first: true,
						deep: null,
					})
					.appendChild(document.body)
					.mount(tool.hmr);
			}

			let check = await component();
			if (check.default) {
				callComponent(check.default);
			}
			if (loader) {
				loader.remove(false);
			}
		} else {
			let hmr = HMR.find(component.name);
			if (hmr) {
				component = hmr;
			}
			callComponent(component);
		}

		if (nested) {
			let virtualOutlet = [];
			nested.forEach((nesteds, index) => {
				let previous = new EntityRender(nesteds.component, {
					arg: [App.get(keyApplication, "app")],
					key: keyApplication,
				});
				previous
					.start()
					.compile({
						first: true,
						deep: null,
					})
					.replaceChildren(!index ? entry : virtualOutlet[index - 1].component.outlet)
					.mount(tool.hmr)
					.saveToExtension()
					.done((instance) => {
						virtualOutlet.push(instance);

						if (instance.component.outlet && index === nested.length - 1) {
							let outlet = instance.component.$node.querySelector(instance.component.outlet);
							if (outlet) {
								current
									.start()
									.compile({
										first: true,
										deep: null,
									})
									.appendChild(outlet)
									.mount(tool.hmr)
									.saveToExtension()
									.done(function () {
										this.component.$node["dataset"]["keep"] = true;
										if (entity) {
											entity.removePrevious();
											entity.add(this.component);
											entity.inject(this.component);
											entity.afterEach(configure);
										}
									});
							}
						}
					});
			});
		} else {
			current
				.start()
				.compile({
					first: true,
					deep: null,
				})
				.replaceChildren(entry)
				.mount(tool.hmr)
				.saveToExtension()
				.done(function () {
					this.component.$node["dataset"]["keep"] = true;
					if (entity) {
						entity.removePrevious();
						entity.add(this.component);
						entity.inject(this.component);
						entity.afterEach(configure);
					}
				});
		}
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
				tool,
				config,
			});
		}

		const { result, isValid, params, nested } = check(config, url);

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
					EntityRouter.gotoNotFound(app, config, url, goto, tool);
					return false;
				}
			}
			if ((!result.config.search && uri.search) || (result.config.search && !uri.search)) {
				return EntityRouter.gotoNotFound(app, config, url, goto, tool);
			}

			const entity = new EntityRouter(app, config, tool);

			if (!entity.beforeEach(result.config)) return false;

			EntityRouter.change(url, tool);
			EntityRouter.found(url, tool);

			return goto(app, url, result.component, result.config, params, uri.search, entity, nested);
		} else {
			return EntityRouter.gotoNotFound(app, config, url, goto, tool);
		}
	};
	return (app: Component, blaze, hmr, keyApp) => {
		/**
		 * inject router to current component
		 */
		tool = {
			$: {
				change: [],
				active: null,
				error: [],
				found: [],
			},
			ready,
			hmr,
			go(goNumber: number) {
				history.go(goNumber);
			},
			back: () => {
				history.back();
			},
			push: (url: URL | any) => {
				if (!url.origin && !(url === "/")) {
					url = location.origin + url;
					url = new URL(url);
				}
				if (url === "/") {
					url = location.origin;
				}
				if (!url.origin) {
					url = new URL(url);
				}
				if ((url.search && url.search !== location.search) || !(url.pathname === location.pathname)) {
					ready(app, url);
				}
			},
			watch(data) {
				let check = this.$.change.find((item) => item.toString() === data.toString());
				if (!check) {
					this.$.change.push(data);
				}
			},
			get run() {
				return {
					error: (error) => this.$.error.forEach((data) => data(error)),
					found: (message) => this.$.found.forEach((data) => data(message)),
				};
			},
		};
		let current = Router.get(keyApp);
		app.$router = tool;
		if (!current) {
			Router.set(tool);
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
					popstate = false;
				});
			}
		});

		/**
		 * @onMakeComponent
		 * inject router to always component
		 */
		blaze.onMakeComponent.push((component) => {
			Object.defineProperty(component, "$router", {
				get: () => {
					return tool;
				},
				set: () => {
					return true;
				},
			});
		});

		/**
		 * @onReload
		 * hot reload
		 */
		blaze.onReload.push((updateComponent: any[]) => {
			let component = tool.$.active;
			let loader = tool.loader;
			let createApp = App.get(keyApp);
			let newComponent = updateComponent.find(
				(newComponents) =>
					createApp.isSameName(component, newComponents) && createApp.isComponent(newComponents)
			);
			if(loader) {
				let findLoader = updateComponent.find(
					(newComponents) =>
						createApp.isSameName(loader, newComponents) && createApp.isComponent(newComponents)
				);
				if (findLoader) {
					Object.assign(tool, {
						loader: newComponent,
					});
					HMR.set(newComponent);
				}
			}
			if (component) {
				if (newComponent) {
					component.__proto__.constructor = newComponent;
					Object.assign(
						component,
						createApp.componentProcess({ component, newComponent, key: 0, previous: app })
					);
					HMR.set(newComponent);
				}
				component.$deep.registry.map((data) =>
					createApp.reloadRegistry(data, component)
				);
			}
		});
	};
};

/**
 * @check
 * check potential match on route with url
 */
function check(config: any, url: string, nested?: any) {
	let result,
		isValid,
		params = {};
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
			let getChildren;
			config.url.filter((data) => {
				let isNested = url.split("/").slice(2);
				if (isNested.length && data.config.children) {
					getChildren = check({ url: data.config.children }, "/" + isNested.join("/"), [
						...(nested || []),
						data,
					]);
				}
			});
			if (getChildren && getChildren.isValid) {
				return getChildren;
			}
			isValid = false;
			return { result, isValid, nested, params };
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

	if (routes && routes.config.children) {
		let getChildren = check({ url: routes.config.children }, "/", [...(nested || []), routes]);
		if (getChildren) {
			return getChildren;
		}
	}

	return { result, isValid, params, nested };
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
		let router = Router.get(keyApp);
		router.loader = loader;
		router.ready(component);
		window.addEventListener("popstate", () => {
			if (!location.hash) {
				popstate = true;
				router.ready(component, location);
			}
		});
	}, component);
};

export const page = (path: string, component: any, config: any = {}) => ({
	path,
	component,
	config,
});

export const outletIn = (entry, component) => {
	component.outlet = entry;
};
