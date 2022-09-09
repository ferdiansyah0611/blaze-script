import { state } from "./utils";
import { rendering, equalProps, getBlaze } from "./core";
import { makeChildren, makeAttribute } from "./maker";
import { Component, RegisteryComponent } from "../blaze.d";
import { diffChildren } from "./diff";
import { App, HMR } from "./global";

/**
 * @createElement
 * createElement for blaze
 * @return HTMLElement
 */
export default function e(
	component: Component,
	nodeName: string | Function | any,
	data: any,
	...children: Element[]
): Element {
	/**
	 * @delcaration
	 */
	const $deep = component.$deep;

	let el: Element | any, isFragment: boolean;

	if (!data) {
		data = {};
	}
	if (typeof nodeName === "function" || (typeof nodeName === "object" && nodeName.lazy)) {
		const diffProps = (checkComponent) => {
			let equal = equalProps(checkComponent.props, data);
			if (equal === false) {
				// disable trigger on update props
				let newProps = data ? { ...data } : {};
				checkComponent.$deep.disableTrigger = true;
				Object.assign(checkComponent.props, newProps);
				checkComponent.$deep.disableTrigger = false;
				// trigger only on node.updating
				checkComponent.$node["updating"] = true;
			}
		};
		if (nodeName.lazy) {
			let newComponent;
			el = document.createElement("div");
			el.dataset.lazy = "";
			el.$lazy = nodeName;
			el.$props = data;

			(async () => {
				let call = nodeName.component();
				if (call instanceof Promise) {
					if (data.fallback) {
						data.fallback.dataset.loading = true;
						el.append(data.fallback);
					}

					let result = await call;
					if (data.fallback) {
						data.fallback.remove();
					}

					if (result.default) {
						let key = data.key ?? 0;
						let check = $deep.registry.find(
							(item: RegisteryComponent) =>
								item.component.constructor.name === result.default.name && item.key === key
						);
						if (!check) {
							newComponent = new result.default(component, App.get(component.$config?.key || 0, 'app'));
							if (component.$config) {
								newComponent.$config = component.$config;
							}
							state("props", data ? { ...data } : {}, newComponent);
							const resulted = rendering(
								newComponent,
								$deep,
								true,
								data,
								key,
								newComponent.constructor,
								children,
								component
							);
							if (resulted) el.append(resulted);
							return el;
						}

						diffProps(check.component);
						const resulted = rendering(
							check.component,
							$deep,
							false,
							data,
							key,
							check.component.constructor,
							children
						);
						diffChildren(check.component.$node, resulted, check.component);
						if (resulted) el.append(resulted);
					}
				}
			})();
			return el;
		} else {
			/**
			 * @component
			 * check component if not exist add to registery $deep, rendering, and lifecycle. if exists and props has changed are will trigger
			 */
			let key = data.key ?? 0;
			let check = $deep.registry.find(
				(item: RegisteryComponent) => item.component.constructor.name === nodeName.name && item.key === key
			);
			/**
			 * @registry
			 */

			let hmr = HMR.find(nodeName.name);
			if(hmr) {
				nodeName = hmr;
			}
			if (!check) {
				let newComponent = new nodeName(component, App.get(component.$config?.key || 0, 'app'));
				// inject config app
				if (component.$config) {
					Object.defineProperty(newComponent, "$config", {
						get: () => {
							return component.$config;
						}
					});
				}
				Object.defineProperty(newComponent, "$root", {
					get: () => {
						return component;
					}
				});
				// props registery
				state("props", data ? { ...data } : {}, newComponent);
				const result = rendering(newComponent, $deep, true, data, key, nodeName, children, component);
				return result;
			}

			diffProps(check.component);

			const result = rendering(check.component, $deep, false, data, key, nodeName, children);
			diffChildren(check.component.$node, result, check.component);
			return result;
		}
	}

	/**
	 * @fragment
	 * logic if node is fragment/first element on component
	 */
	const fragment = () => {
		if (nodeName === "Fragment") {
			el = document.createDocumentFragment();
			isFragment = true;
		}
	};

	/**
	 * @makeElement
	 * create element, svg and observe data property
	 */
	const makeElement = () => {
		let svg;
		let componentName = component.constructor.name;
		if (!isFragment) {
			if (["svg", "path", "g", "circle", "ellipse", "line"].includes(nodeName) || data.svg) {
				svg = true;
				el = document.createElementNS("http://www.w3.org/2000/svg", nodeName);
				for (const [k, v] of Object.entries(data)) {
					el.setAttribute(k, v);
				}
			} else {
				el = document.createElement(nodeName);
			}

			if (!svg) makeAttribute(data, el, component);
		}

		makeChildren(children, el);
		el.$name = componentName;
		getBlaze(component.$config?.key || 0)?.run?.onMakeElement(el);
		return;
	};
	/**
	 * @call fragment, makeElement
	 */
	fragment();
	makeElement();

	return el;
};
