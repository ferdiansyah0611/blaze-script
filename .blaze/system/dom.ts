import { Component } from "../blaze.d";
import Lifecycle from "./lifecycle";

/**
 * @removeComponentOrEl
 * remove a subcomponent or element
 */
export const removeComponentOrEl = function (item: HTMLElement, component: Component) {
	if (item.$children) {
		component.$deep.registry = component.$deep.registry.filter((registry) => {
			if (
				!(registry.component.constructor.name === item.$children.constructor.name && registry.key === item.key)
			) {
				return registry;
			} else {
				registry.component.$deep.remove();
				return false;
			}
		});
	} else {
		item.remove();
	}
};

/**
 * @unmountAndRemoveRegistry
 * unmount and remove registery from root component
 */
export const unmountAndRemoveRegistry = (current: Component, key: number, component: Component) => {
	if (component) {
		component.$deep.registry = component.$deep.registry.filter((registry) => {
			if (!(registry.component.constructor.name === current.constructor.name && registry.key === key)) {
				return registry;
			} else {
				new Lifecycle(registry.component).unmount();
				return false;
			}
		});
	}
};

/**
 * @mountComponentFromEl
 * mount from element
 */
export const mountComponentFromEl = (el: HTMLElement) => {
	if (el.$children) {
		el.$children.$deep.mounted();
	}
};

/**
 * @findComponentNode
 * find component with node
 */
export const findComponentNode = (parent: HTMLElement, item: HTMLElement) => {
	return parent.querySelector(`[data-n="${item.$name}"][data-i="${item.key}"]`);
};
