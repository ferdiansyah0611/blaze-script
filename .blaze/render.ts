import { rendering, EntityRender } from "./system/core";
import { Component, InterfaceApp, InterfaceBlaze } from "./blaze.d";
import Lifecycle from "./system/lifecycle";
import { diffChildren } from "./system/diff";
import isEqualWith from "lodash.isequalwith";
import { Store, HMR, App } from "./system/global";
import withError from "@root/plugin/error";

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
	app: Component;
	constructor(el: string, component: any, config?: any) {
		this.plugin = [];
		this.el = el;
		this.component = component;
		this.config = config;
		this.blaze = new Blaze();
		if (config.hasOwnProperty("key") === false || !(typeof config.key === "number")) {
			this.config.key = 0;
		}
		this.use(withError());
	}
	componentProcess({ component, newComponent, key, previous }: any) {
		let error = window.$error;
		error.close();
		try {
			let app = App.get(component.$config?.key || 0);
			if (previous) {
				newComponent = new newComponent(previous, app);
			} else {
				newComponent = new newComponent(app);
			}

			let old = new Lifecycle(component);
			old.unmount();

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

			diffChildren(component.$node, result, newComponent);
			newComponent.$node = component.$node;
			newComponent.$node.$children = newComponent;
			newComponent.$deep.hasMount = false;

			let now = new Lifecycle(newComponent);
			now.created();
			now.mount({}, false, true);
			now.watch();
			if (error.state.data.title) {
				error.close();
			}
			return newComponent;
		} catch (err) {
			error.open(newComponent.constructor.name, err.stack);
		}
	}
	componentUpdate(component, newComponent) {
		Object.keys(component).forEach((name) => {
			if (["$node", "render", "children"].includes(name)) {
				return;
			}
			if (name === "$deep") {
				Object.keys(component[name]).forEach((sub) => {
					if (
						[
							"mount",
							"watch",
							"unmount",
							"effect",
							"beforeCreate",
							"created",
							"beforeUpdate",
							"updated",
						].includes(sub)
					)
						return;
					newComponent[name][sub] = component[name][sub];
				});
				return;
			}
			if (typeof component[name] === "object") {
				if (component[name]._isProxy) {
					let check = isEqualWith(component[name], newComponent[name]);
					if (!check) {
						Object.assign(component[name], newComponent[name]);
						return;
					}
				}
			}
			newComponent[name] = component[name];
		});
		return newComponent;
	}
	isComponent = (component) => component.toString().indexOf("init(this)") !== -1;
	reloadRegistry = (sub: any, previous?: Component) => {
		let component = sub.component;
		let hmrArray = HMR.get();
		component.$deep.registry = component.$deep.registry.map((data) => this.reloadRegistry(data, component));
		hmrArray.forEach((hmr) => {
			if (component.constructor.name === hmr.name && this.isComponent(hmr)) {
				Object.assign(
					component,
					this.componentProcess({ component, newComponent: hmr, key: sub.key, previous })
				);
			}
		});
		return sub;
	};
	reload(newHmr, isStore: any) {
		HMR.set(newHmr);

		const hmrArray = HMR.get();
		if (isStore) {
			let store = Store.get();

			hmrArray.forEach((hmr) => {
				let get = hmr("", "", true);
				let current = store[get.entry];
				if (current) {
					Object.keys(current.values).forEach((values) => {
						if (
							Array.isArray(current.values[values]) &&
							!isEqualWith(current.values[values], get.values[values])
						) {
							current.listening.forEach((listening, i) => {
								if (listening.listen.find((listen) => listen === values) && current.registery[i]) {
									current.registery[i].$deep.trigger();
								}
							});
						}
					});
					Object.assign(current.values, get.values);
				}
			});
			return;
		}
		hmrArray.forEach((hmr) => {
			if (hmr.name === this.component.name && this.isComponent(hmr)) {
				Object.assign(this.app, this.componentProcess({ component: this.app, newComponent: hmr, key: 0 }));
				return;
			}
		});
		this.app.$deep.registry = this.app.$deep.registry.map((data) => this.reloadRegistry(data));
		this.blaze.run.onReload(hmrArray);
		HMR.clear();
	}
	mount() {
		document.addEventListener("DOMContentLoaded", () => {
			App.set(this);

			const app = new EntityRender(this.component, {
				inject: {
					$config: this.config,
				},
			});
			app.beforeCompile(({ component }) => {
				this.app = component;
				this.plugin.forEach((plugin: any) => plugin(component, this.blaze, false, this.config.key));
			})
				.start()
				.compile({
					first: true,
					deep: null,
				})
				.replaceChildren(this.el)
				.mount(false)
				.done(({ component }) => {
					this.blaze.run.onAfterAppReady(component);
				});
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
	onMakeElement: any[];
	onMakeComponent: any[];
	onAfterAppReady: any[];
	onReload: any[];
	onStartComponent: any[];
	onEndComponent: any[];
	constructor() {
		this.onMakeElement = [];
		this.onMakeComponent = [];
		this.onAfterAppReady = [];
		this.onReload = [];
		this.onStartComponent = [];
		this.onEndComponent = [];
	}
	get run() {
		return {
			onMakeElement: (el: HTMLElement) => this.onMakeElement.forEach((item) => item(el)),
			onMakeComponent: (component: Component) => this.onMakeComponent.forEach((item) => item(component)),
			onAfterAppReady: (component: Component) => this.onAfterAppReady.forEach((item) => item(component)),
			onReload: (component: Component) => this.onReload.forEach((item) => item(component)),
			onStartComponent: (component: Component) => {
				let endPerform = [];
				this.onStartComponent.forEach((item) => endPerform.push(item(component)));

				return () => {
					endPerform.forEach((item) => item && item());
				};
			},
			onEndComponent: (component: Component) => {
				this.onEndComponent.forEach((item) => item(component));
			},
		};
	}
}

export const createPortal = (component: Component) => {
	component.$portal = crypto.randomUUID();
};
