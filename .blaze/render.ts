import { addLog, addComponent, reload } from "@root/plugin/extension";
import { rendering } from "./core";
import { getBlaze, batch } from "./utils";
import { Component, InterfaceApp, InterfaceBlaze } from "./blaze.d";

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
	mount() {
		const load = (hmr = false) => {
			let app = new this.component();
			app.$config = this.config;
			// inject to window
			if (!window.$app) {
				window.$app = [];
				window.$blaze = [];
			}
			window.$app[this.config.key] = app;
			window.$blaze[this.config.key] = this.blaze;
			// run plugin
			this.plugin.forEach((plugin: any) =>
				plugin(window.$app[this.config.key], window.$blaze[this.config.key], hmr, this.config.key)
			);
			addComponent(app, true);
			// render
			app.$deep.disableEqual = true;
			rendering(app, null, true, false, {}, 0, app.constructor, []);

			let query = document.querySelector(this.el);
			Array.from(query.children).forEach((node: HTMLElement) => node.remove());
			query.append(window.$app[this.config.key].$node);
			app.$deep.mounted(false);
			// mountCall(app.$deep, {}, false);
			// blaze event
			getBlaze(this.config.key).runAfterAppReady(app);
		};

		if (window.$app) {
			window.$app[this.config.key].$deep.remove();
			reload();
			batch(() => {
				addLog(
					{
						msg: "[HMR] reloading app",
					},
					false
				);
				addComponent(window.$app[this.config.key], false);
			}, window.$extension);
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
	constructor() {
		this.everyMakeElement = [];
		this.everyMakeComponent = [];
		this.afterAppReady = [];
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
}

export const createPortal = (component: Component) => {
	component.$portal = crypto.randomUUID();
};
