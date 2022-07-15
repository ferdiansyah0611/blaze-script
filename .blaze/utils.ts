import { mountCall } from "./core";
import { Component, Watch, Mount, InterfaceApp, InterfaceBlaze } from "./blaze.d";
import { addLog, addComponent, reload } from "@root/plugin/extension";

/**
 * @App
 * class for new application
 */
export class App implements InterfaceApp {
	el: string;
	component: any;
	plugin: any[];
	blaze: any;
	config?: any;
	constructor(el: string, component: any, config: any) {
		this.plugin = [];
		this.el = el;
		this.component = component;
		this.config = config;
		this.blaze = new Blaze();
	}
	mount() {
		const load = (hmr = false) => {
			let old = performance.now(),
				now,
				duration,
				msg;
			let app = new this.component();
			app.$config = this.config;
			// inject to window
			window.$app = app;
			window.$blaze = this.blaze;
			// run plugin
			this.plugin.forEach((plugin: any) => plugin(window.$app, window.$blaze, hmr));
			// render
			app.$node = app.render();
			// extension & timer
			now = performance.now();
			duration = (now - old).toFixed(1);
			msg = `[${app.constructor.name}] ${duration}ms`;
			app.$deep.time = duration;
			batch(() => {
				addLog(
					{
						msg,
					},
					false
				);
				addComponent(app, false);
			}, window.$extension);

			let query = document.querySelector(this.el);
			Array.from(query.children).forEach((node: HTMLElement) => node.remove());
			query.append(window.$app.$node);
			mountCall(app.$deep, {}, false);
		}

		if(window.$app) {
			reload();
			batch(() => {
				addLog(
					{
						msg: '[HMR] reloading app',
					},
					false
				);
				addComponent(window.$app, false);
			}, window.$extension);
			load(true);
			return;
		}
		document.addEventListener("DOMContentLoaded", () => {
			load()
		});
	}
	use(plugin: any) {
		this.plugin.push(plugin);
	}
}

/**
 * @Blaze
 * class for event on blaze, like onMakeElement and more
 */
export class Blaze implements InterfaceBlaze {
	everyMakeElement: any[];
	everyMakeComponent: any[];
	constructor() {
		this.everyMakeElement = [];
		this.everyMakeComponent = [];
	}
	set onMakeElement(value: any) {
		this.everyMakeElement.push(value);
	}
	runEveryMakeElement(el: HTMLElement) {
		this.everyMakeElement.forEach((item) => item(el));
	}
	set onMakeComponent(value: any) {
		this.everyMakeComponent.push(value);
	}
	runEveryMakeComponent(component: Component) {
		this.everyMakeComponent.forEach((item) => item(component));
	}
}
/**
 * @config
 * get blaze app or config
 */
export const getAppConfig = () => window.$app?.$config || {};
export const getBlaze = () => window.$blaze || {};

/*----------UTILITES----------*/

/**
 * @logging
 * log for blaze, disable in production
 */
export const log = (...msg: any[]) => getAppConfig().dev && console.log(">", ...msg);

/**
 * @render
 * utils for rendering
 */
export const render = (callback: Function, component: Component) => (component.render = callback);

/**
 * @state
 * state management and context on blaze
 */
export const state = function (name: string, initial: any, component: Component | null, registry?: Component[]) {
	// for context
	if (Array.isArray(registry)) {
		return new Proxy(
			{ ...initial, _isContext: true },
			{
				set(a: any, b: string, c: any) {
					a[b] = c;
					registry.forEach((register: Component) => {
						if (!register.$deep.batch) {
							register.$deep.trigger();
						}
						// watching
						register.$deep.watch.forEach((watch: Watch) => {
							let find = watch.dependencies.find((item: string) => item === `ctx.${name}.${b}`);
							if (find) {
								watch.handle(b, c);
							}
						});
					});
					return true;
				},
			}
		);
	}
	// for state
	else {
		let handle = (b, c) => {
			// watching
			component.$deep.watch.forEach((watch: Watch) => {
				let find = watch.dependencies.find((item: string) => item === `${name}.${b}`);
				if (find) {
					watch.handle(b, c);
				}
			});
		};
		// for update
		component[name] = new Proxy(
			{ ...initial, _isProxy: true },
			{
				set(a, b, c) {
					a[b] = c;
					if (!component.$deep.batch && !component.$deep.disableTrigger) {
						component.$deep.trigger();
					}
					if (!component.$deep.disableTrigger) {
						handle(b, c);
					}
					return true;
				},
			}
		);
		// trigger for first render
		if (name === "props" && !component.$deep.update) {
			component.$deep.disableTrigger = true;
			for (const props of Object.entries(component.props)) {
				handle(props[0], props[1]);
			}
			component.$deep.disableTrigger = false;
			mount(() => {
				component.$deep.trigger();
			}, component);
		}
		return component[name];
	}
};

/**
 * @context
 * context on blaze
 */
export const context = (entry: string, defaultContext: any, action: any) => {
	let registery: Component[] = [];
	let values = state(entry, defaultContext, null, registery);
	return (component) => {
		if (action) {
			if (!component.$deep.dispatch) {
				component.$deep.dispatch = {};
			}
			component.$deep.dispatch[entry] = action;
		}
		registery.push(component);
		component.ctx[entry] = values;
	};
};

/**
 * @watch
 * watching a state or props on component
 */
export const watch = function (dependencies: string[], handle: Function, component: Component) {
	if (!component.$deep.watch) {
		component.$deep.watch = [];
	}
	let key = component.$deep.watch.push({
		dependencies,
		handle,
	});
	return {
		clear: () => (component.$deep.watch = component.$deep.watch.filter((...data: any) => data[1] !== key - 1)),
	};
};

/**
 * @mount
 * lifecycle methods on first render, can be multiply mount
 */
export const mount = (callback: Function, component: Component) => {
	let data: Mount = {
		run: false,
		handle(defineConfig: any = {}, update: boolean = false) {
			if (update) {
				// batch if props 0 length
				if (Object.keys(defineConfig).length) {
					batch(() => {
						Object.entries(defineConfig).forEach((item: any[]) => {
							// check name property and value is different
							if (Object.keys(component.props).includes(item[0])) {
								if (item[1] !== component.props[item[0]]) {
									component.props[item[0]] = item[1];
									// watching
									component.$deep.watch.forEach((watch) => {
										let find = watch.dependencies.find(
											(dependencies) => dependencies === `props.${item[0]}`
										);
										if (find) {
											watch.handle(item[0], item[1]);
										}
									});
								}
							}
						});
					}, component);
				}
			}
			if (!this.run) {
				this.run = true;
				let unmount = callback();
				unmount && component.$deep.unmount.push(unmount);
			}
		},
	};

	component.$deep.mount.push(data);
};

/**
 * @mount
 * lifecycle methods on all render
 */
export const layout = (callback: Function, component: Component) => {
	if (!component.$deep.layout) {
		component.$deep.layout = [];
	}
	component.$deep.layout.push(callback);
	return true;
};

/**
 * @batch
 * utils for re-rendering
 */
export const batch = async (callback: Function, component: Component) => {
	if(component) {
		component.$deep.batch = true;
		await callback();
		component.$deep.batch = false;
		component.$deep.trigger();
	}
};

/**
 * @dispatch
 * utils for call context action
 */
export const dispatch = (name: string, component: Component, data: any, autoBatching: boolean = false) => {
	let path = name.split(".");
	let entry = path[0];
	let key = path[1];
	let check = component.$deep.dispatch[entry];

	let action = () => check[key](component["ctx"][entry], data);

	if (check) {
		if (autoBatching) {
			batch(action, component);
		} else {
			action();
		}
	}
};
