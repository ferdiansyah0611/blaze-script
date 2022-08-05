import { rendering, unmountCall, mountCall, watchCall } from "./core";
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
	componentProcess({ component, newComponent, key, previous }: any) {
		if(previous) {
			newComponent = new newComponent(previous, window.$app[component.$config?.key || 0]);
		} else {
			newComponent = new newComponent(window.$app[component.$config?.key || 0]);
		}

		unmountCall(component.$deep);
		newComponent = this.componentUpdate(component, newComponent);
		const result = rendering(
			newComponent,
			component.$deep,
			false,
			component.props,
			key,
			newComponent.constructor,
			component.children
		);
		// console.log(component.$node, result);
		// console.log(component.render.toString(), newComponent.render.toString());
		diffChildren(component.$node, result, newComponent);
		newComponent.$node = component.$node;
		newComponent.$node.$children = newComponent;
		newComponent.$deep.hasMount = false;
		mountCall(newComponent.$deep, {}, false, true);
		watchCall(newComponent);
		return newComponent;
	}
	componentUpdate(component, newComponent) {
		Object.keys(component).forEach((name) => {
			if (["$node", "render", "children"].includes(name)) {
				return;
			}
			if (name === "$deep") {
				Object.keys(component[name]).forEach((sub) => {
					if(['mount', 'watch', 'unmount'].includes(sub)) return;
					newComponent[name][sub] = component[name][sub]
				})
				return;
			}
			newComponent[name] = component[name];
		});
		return newComponent;
	}
	isComponent = (component) => component.toString().indexOf('init(this)') !== -1;
	reload() {
		window.$hmr.forEach((hmr) => {
			if (hmr.name === this.component.name && this.isComponent(hmr)) {
				let component = window.$app[this.config.key || 0];
				let newComponent = hmr;
				Object.assign(component, this.componentProcess({ component, newComponent, key: 0 }))
				return;
			}
		})
		const checkComponent = (sub: any, previous?: Component) => {
			let component = sub.component;
			component.$deep.registry = component.$deep.registry.map((data) => checkComponent(data, component));
			window.$hmr.forEach((hmr) => {
				if (component.constructor.name === hmr.name && this.isComponent(hmr)) {
					let newComponent = hmr;
					Object.assign(sub.component, this.componentProcess({ component, newComponent, key: sub.key, previous }))
				}
			})
			return sub;
		};
		window.$app[this.config.key].$deep.registry = window.$app[this.config.key].$deep.registry.map((data) => checkComponent(data));
		this.blaze._onReload(window.$hmr);
		window.$hmr = null;
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
	_onReload(component: Component) {
		this.onReload.forEach((item) => item(component));
	}
}

export const createPortal = (component: Component) => {
	component.$portal = crypto.randomUUID();
};
