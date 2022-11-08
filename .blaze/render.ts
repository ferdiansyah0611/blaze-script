import { rendering, EntityRender } from "./system/core";
import { Component, AppType, BlazeType, ComponentProcessArgType } from "./blaze.d";
import Lifecycle from "./system/lifecycle";
import { diffChildren } from "./system/diff";
import isEqualWith from "lodash.isequalwith";
import { Store, HMR, App } from "./system/global";
import { isComponent, isSameName } from "./system/constant";
import withError from "@root/plugin/error";

/**
 * @App
 * class for new application
 */
export class createApp implements AppType {
	app: Component;
	el: string;
	component: any;
	plugin: any[];
	blaze: BlazeType;
	config: any;
	constructor(el: string, component: any, config?: any) {
		this.el = el;
		this.component = component;
		this.config = config;
		this.config.key = App.set(this) - 1;
		this.blaze = new Blaze();
		this.plugin = [];
		this.use(withError());
	}
	componentProcess({ component, newComponent, key, previous }: ComponentProcessArgType) {
		let error = window.$error;
		error.close();
		try {
			let app = App.get(component.$config?.key || 0, "app");
			if (previous) {
				newComponent = new newComponent(previous, app);
			} else {
				newComponent = new newComponent(app);
			}

			let old = new Lifecycle(component);
			old.unmount();
			newComponent['$root'] = component['$root']

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

			diffChildren(component.$node, result, newComponent, true, component);
			newComponent.$node = component.$node;
			newComponent.$node.$children = newComponent;
			newComponent.$deep.hasMount = false;

			let allow = ["mount", "watch", "unmount", "effect", "beforeCreate", "created", "beforeUpdate", "updated"];
			allow.forEach((name) => {
				if (newComponent.$deep[name]) {
					if (newComponent.$deep[name].length) {
						component.$deep[name] = newComponent.$deep[name];
					}
				}
			});
			let now = new Lifecycle(newComponent);
			now.beforeCreate();
			now.created();
			now.mount({}, false, true);
			now.watch();
			now.effect(true);
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
							"registry",
						].includes(sub)
					)
						return;
					newComponent[name][sub] = component[name][sub];
				});
				return;
			}
			if (name === "ctx") {
				let length = {
					old: Object.keys(component[name]).length,
					now: Object.keys(newComponent[name]).length,
				};
				if ((!length.old && length.now) || (length.old && !length.now)) {
					return;
				}
				newComponent[name] = component[name];
				return;
			}
			if (Array.isArray(component[name])) {
				newComponent[name] = component[name];
				return;
			}
			if (typeof component[name] === "object") {
				if (name === "props" || component[name].nodeType) {
					newComponent[name] = component[name];
					return;
				}
				if (component[name]._isProxy) {
					let check = isEqualWith(component[name], newComponent[name]);
					if (!check) {
						Object.assign(component[name], newComponent[name]);
					}
				}
			}
			if (typeof component[name] === "function") {
				if (component[name].toString() === newComponent[name].toString()) {
					return;
				} else {
					newComponent[name] = newComponent[name].bind(component);
					return;
				}
			}
			if (newComponent[name] && !component[name]) {
				return (component[name] = newComponent[name]);
			}
			newComponent[name] = component[name];
		});

		return newComponent;
	}
	reloadRegistry = (component: Component, previous?: Component) => {
		let hmrArray = HMR.get();
		let newComponent = hmrArray.find(
			(newComponents) => isSameName(component, newComponents) && isComponent(newComponents)
		);
		if (newComponent) {
			Object.assign(component, this.componentProcess({ component, newComponent, key: component.props.key, previous }));
			component["__proto__"].constructor = newComponent;
		}
		component.$deep.registry.map((data) => this.reloadRegistry(data, component));
		return component;
	};
	reload(newHmr: any, isStore: any) {
		HMR.set(newHmr);
		if (isStore) {
			let store = Store.get();

			newHmr.forEach((hmr) => {
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

		let newComponent = newHmr.find(
			(newComponents) => isSameName(this.app, newComponents) && isComponent(newComponents)
		);
		if (newComponent) {
			Object.assign(this.app, this.componentProcess({ component: this.app, newComponent, key: 0 }));
			return;
		}
		this.app.$deep.registry.map((data) => this.reloadRegistry(data));
		this.blaze.run.onReload(newHmr);
	}
	mount() {
		document.addEventListener("DOMContentLoaded", () => {

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
export class Blaze implements BlazeType {
	onMakeElement = [];
	onMakeComponent = [];
	onAfterAppReady = [];
	onReload = [];
	onStartComponent = [];
	onEndComponent = [];
	onDirective = [];
	get run(){
		return{
			onMakeElement: (el) => this.onMakeElement.forEach((item) => item(el)),
			onMakeComponent: (component) => this.onMakeComponent.forEach((item) => item(component)),
			onAfterAppReady: (component) => this.onAfterAppReady.forEach((item) => item(component)),
			onReload: (component) => this.onReload.forEach((item) => item(component)),
			onStartComponent: (component) => {
				let endPerform = [];
				this.onStartComponent.forEach((item) => endPerform.push(item(component)));
		
				return () => {
					endPerform.forEach((item) => item && item());
				};
			},
			onEndComponent: (component) => this.onEndComponent.forEach((item) => item(component)),
			onDirective: (prev, el, opt) => this.onDirective.forEach((item) => item(prev, el, opt))
		}
	}
}

export const createPortal = (component: Component) => {
	component.$portal = crypto.randomUUID();
};
