import { rendering, unmountCall, mountCall } from "./core";
import { Component, InterfaceApp, InterfaceBlaze } from "./blaze.d";
import { diffChildren } from "./diff";

/**
 * @App
 * class for new application
 */
export class createApp implements InterfaceApp {
	el: string;
	component: any;
	plugin: any[];
	blaze: any;
	config?: any;
	constructor(el: string, component: any, config?: any) {
		this.plugin = [];
		this.el = el;
		this.component = component;
		this.config = config;
		this.blaze = new Blaze();
		if (config.hasOwnProperty("key") === false || !(typeof config.key === "number")) {
			this.config.key = 0;
		}
	}
	reload() {
		const componentAssign = (component, newComponent) => {
			Object.keys(component).forEach((name) => {
				if (name === "$config") {
					newComponent.$config = component.$config;
					return;
				}
				if (["$node", "render", "children"].includes(name)) {
					return;
				}
				if(name === '$deep') {
					Object.assign(newComponent[name], component[name]);
					return;
				}
				newComponent[name] = component[name];
			});
			return newComponent;
		}

		if (window.$hmr.name === this.component.name) {
			let component = window.$app[this.config.key || 0];
			let newComponent = new window.$hmr(component);
			componentAssign(component, newComponent);
			unmountCall(component.$deep);
			const result = rendering(newComponent, component.$deep, false, {}, 0, window.$hmr, component.children);
			diffChildren(component.$node, result, newComponent);
			newComponent.$node = component.$node;
			window.$app[this.config.key || 0] = newComponent;
			mountCall(newComponent.$deep);
			return;
		}
		const checkComponent = (sub) => {
			let component = sub.component;
			component.$deep.registry = component.$deep.registry.map(checkComponent);
			if (component.constructor.name === window.$hmr.name) {
				let newComponent = new window.$hmr(component, window.$app[component.$config?.key || 0]);
				componentAssign(component, newComponent);
				unmountCall(component.$deep);
				let data = {};
				const result = rendering(newComponent, component.$deep, false, data, sub.key, window.$hmr, component.children);
				diffChildren(component.$node, result, newComponent);
				newComponent.$node = component.$node;
				newComponent.$node.$children = newComponent;
				sub.component = newComponent;
				mountCall(newComponent.$deep);
			}
			return sub;
		};
		window.$app[this.config.key].$deep.registry = window.$app[this.config.key].$deep.registry.map(checkComponent);
		window.$hmr = {};
	}
	mount() {
		const load = (hmr = false) => {
			let app = new this.component();
			app.$config = this.config;
			// inject to window
			if (!window.$app) {
				window.$app = [];
				window.$blaze = [];
				window.$createApp = [];
				window.$app[this.config.key] = app;
				window.$createApp[this.config.key] = this;
				window.$blaze[this.config.key] = this.blaze;
			}
			// run plugin
			this.plugin.forEach((plugin: any) =>
				plugin(window.$app[this.config.key], window.$blaze[this.config.key], hmr, this.config.key)
			);
			// render
			app.$deep.disableEqual = true;
			rendering(app, null, true, {}, 0, app.constructor, []);

			let query = document.querySelector(this.el);
			query.replaceChildren(window.$app[this.config.key].$node);
			app.$deep.mounted(false, hmr);

			this.blaze.runAfterAppReady(app);
		};

		if (window.$app) {
			window.$app[this.config.key].$deep.remove(true, true);
			this.blaze._onReload(window.$app[this.config.key]);
			load(true);
			return;
		}
		document.addEventListener("DOMContentLoaded", () => {
			load();
		});
	}
	use(plugin: any) {
		this.plugin.push(plugin);
	}
}

/**
 * @Blaze
 * class for event on blaze, like on make element and more
 */
export class Blaze implements InterfaceBlaze {
	everyMakeElement: any[];
	everyMakeComponent: any[];
	afterAppReady: any[];
	startComponent: any[];
	endComponent: any[];
	onReload: any[];
	constructor() {
		this.everyMakeElement = [];
		this.everyMakeComponent = [];
		this.afterAppReady = [];
		this.startComponent = [];
		this.endComponent = [];
		this.onReload = [];
	}
	runEveryMakeElement(el: HTMLElement) {
		this.everyMakeElement.forEach((item) => item(el));
	}
	runEveryMakeComponent(component: Component) {
		this.everyMakeComponent.forEach((item) => item(component));
	}
	runAfterAppReady(component: Component) {
		this.afterAppReady.forEach((item) => item(component));
	}
	_startComponent(component: Component) {
		let endPerform = [];
		this.startComponent.forEach((item) => endPerform.push(item(component)));

		return () => {
			endPerform.forEach((item) => item && item());
		};
	}
	_endComponent(component: Component) {
		this.endComponent.forEach((item) => item(component));
	}
	_onReload() {
		this.onReload.forEach((item) => item());
	}
}

export const createPortal = (component: Component) => {
	component.$portal = crypto.randomUUID();
};
