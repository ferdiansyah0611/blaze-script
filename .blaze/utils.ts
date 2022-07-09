import { mountUtilities } from "./core";
import {
	Component,
	RegisteryComponent,
	Watch,
	Mount,
	InterfaceApp,
	InterfaceBlaze,
} from "./blaze.d";

// Application
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
		document.addEventListener("DOMContentLoaded", () => {
			let app = new this.component();
			app.$config = this.config;
			// inject to window
			if (!window.$app) {
				window.$app = app;
				window.$blaze = this.blaze;
			}
			this.plugin.forEach((plugin: any) =>
				plugin(window.$app, window.$blaze)
			);
			app.$node = app.render();
			document.querySelector(this.el).append(window.$app.$node);
			mountUtilities(app.$deep, {}, false);
		});
	}
	use(plugin: any) {
		this.plugin.push(plugin);
	}
}
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
		this.everyMakeElement.forEach((item) => item(el))
	}
	set onMakeComponent(value: any) {
		this.everyMakeComponent.push(value);
	}
	runEveryMakeComponent(component: Component) {
		this.everyMakeComponent.forEach((item) => item(component))
	}
}
export const getAppConfig = () => window.$app?.$config || {};
export const getBlaze = () => window.$blaze || {};
// utilites
export const log = (...msg: any[]) =>
	getAppConfig().dev && console.log(">", ...msg);
export const render = (callback: Function, component: Component) =>
	(component.render = callback);
export const state = function (
	name: string,
	initial: any,
	component: Component | null,
	registry?: RegisteryComponent[]
) {
	// for context
	if (Array.isArray(registry)) {
		return new Proxy(initial, {
			set(a: any, b: string, c: any) {
				a[b] = c;
				registry.forEach((register: RegisteryComponent) => {
					if (!register.component.$deep.batch) {
						register.component.$deep.trigger(Array.isArray(c));
					}
					// watching
					register.component.$deep.watch.forEach((watch: Watch) => {
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
		let handle = (b, c) => {
			// watching
			component.$deep.watch.forEach((watch: Watch) => {
				let find = watch.dependencies.find(
					(item: string) => item === `${name}.${b}`
				);
				if (find) {
					watch.handle(b, c);
				}
			});
		};
		// for update
		component[name] = new Proxy(initial, {
			set(a, b, c) {
				a[b] = c;
				if (!component.$deep.batch && !component.$deep.disableTrigger) {
					component.$deep.trigger(Array.isArray(c));
				}
				if (!component.$deep.disableTrigger) {
					handle(b, c);
				}
				return true;
			},
		});
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

export const context = (entry: string, defaultContext: any) => {
	let registery: RegisteryComponent[] = [];
	let values = state(entry, defaultContext, null, registery);
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
				(...data: any) => data[1] !== key - 1
			)),
	};
};
export const mount = (callback: Function, component: Component) => {
	let data: Mount = {
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
	return true;
};
export const batch = async (callback: Function, component: Component) => {
	component.$deep.batch = true;
	await callback();
	component.$deep.batch = false;
	component.$deep.trigger();
};
