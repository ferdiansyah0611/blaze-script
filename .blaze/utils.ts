import { init, mountUtilities } from "./core";
import { Component, RegisteryComponent, Watch } from "./blaze.d";

// Application
export const App = function (el: string, component: Component, config: any) {
	this.plugin = [];
	this.mount = () => {
		document.addEventListener("DOMContentLoaded", () => {
			let app = new component();
			app.$node = app.render();
			app.$config = config;
			// inject to window
			if (!window.$app) {
				window.$app = app;
			}
			document.querySelector(el).append($app.$node);
			this.plugin.forEach((plugin: any) => plugin(window.$app));
			mountUtilities(app.$deep, {}, false);
		});
	};
	this.use = (plugin) => {
		this.plugin.push(plugin);
		return this;
	};
	return this;
};
export const getAppConfig = () => window.$app?.$config || {};
// utilites
export const log = (...msg: any[]) =>
	getAppConfig().dev && console.log(">", ...msg);
export const render = (callback: Function, component: Component) =>
	(component.render = callback);
export const state = function (
	name: string,
	initial: any,
	component: Component,
	registry: RegisteryComponent
) {
	// for context
	if (Array.isArray(registry)) {
		return new Proxy(initial, {
			set(a, b, c) {
				a[b] = c;
				registry.forEach((components: Component) => {
					if (!components.$deep.batch) {
						components.$deep.trigger();
					}
					// watching
					components.$deep.watch.forEach((watch: Watch) => {
						let find = watch.dependencies.find(
							(item: string) => item === `ctx.${name}.${b}`
						);
						if (find) {
							watch.handle(b, c);
						}
					});
				});
				return true;
			},
		});
	}
	// for state
	else {
		component[name] = new Proxy(initial, {
			set(a, b, c) {
				a[b] = c;
				if (!component.$deep.batch) {
					component.$deep.trigger();
				}
				// watching
				component.$deep.watch.forEach((watch: Watch) => {
					let find = watch.dependencies.find(
						(item: string) => item === `${name}.${b}`
					);
					if (find) {
						watch.handle(b, c);
					}
				});
				return true;
			},
		});
		return component[name];
	}
};

export const context = (entry: string, defaultContext: any) => {
	let registery = [];
	let values = state(entry, defaultContext, {}, registery);
	return (component) => {
		registery.push(component);
		component.ctx[entry] = values;
	};
};
export const watch = function (
	dependencies: string[],
	handle: Function,
	component: Component
) {
	if (!component.$deep.watch) {
		component.$deep.watch = [];
	}
	let key = component.$deep.watch.push({
		dependencies,
		handle,
	});
	return {
		clear: () =>
			(component.$deep.watch = component.$deep.watch.filter(
				(data: Watch, i: number) => i !== key - 1
			)),
	};
};
export const mount = (callback: Function, component: Component) => {
	let data = {
		run: false,
		handle(defineConfig: any = {}, update: boolean = false) {
			if (update) {
				batch(() => {
					Object.entries(defineConfig).forEach((item: any[]) => {
						// check name property and value is different
						if (Object.keys(component.props).includes(item[0])) {
							if (item[1] !== component.props[item[0]]) {
								component.props[item[0]] = item[1];
								// watching
								component.$deep.watch.forEach((watch) => {
									let find = watch.dependencies.find(
										(dependencies) =>
											dependencies === `props.${item[0]}`
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
			if (!this.run) {
				this.run = true;
				let unmount = callback();
				unmount && component.$deep.unmount.push(unmount);
			}
		},
	};

	component.$deep.mount.push(data);
};
export const refs = (name: string, component: Component, isArray: boolean) => {
	if (isArray) {
		return (component[name] = []);
	}
	component[name] = null;
};
export const batch = async (callback: Function, component: Component) => {
	component.$deep.batch = true;
	await callback();
	component.$deep.batch = false;
	component.$deep.trigger();
};
