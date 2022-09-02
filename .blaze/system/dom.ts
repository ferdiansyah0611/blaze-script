import { Component } from "../blaze.d";
import Lifecycle from "./lifecycle";

/**
 * @removeComponentOrEl
 * remove a subcomponent or element
 */
export const removeComponentOrEl = function (item: Element, component: Component) {
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
export const unmountAndRemoveRegistry = (newest: Element, old: Element, checkingSub?: boolean) => {
	if (checkingSub) {
		if (old.$root) {
			let check = findComponentNode(newest, old);
			if (!check) {
				removeRegistry(old.$root, old.$children);
			}
			return;
		}
	}
	// not component
	if (!old.$children && checkingSub) {
		Array.from(old.children).forEach((olds: Element) => {
			unmountAndRemoveRegistry(newest, olds, true);
		});
		return;
	}
	// component
	else {
		if (old.$root) {
			let check = findComponentNode(newest, old);
			if (!check) {
				removeRegistry(old.$root, old.$children);
			}
		}
	}
	return;
};

/**
 * @mountComponentFromEl
 * mount all component from element
 */
export const mountComponentFromEl = (el: Element, componentName?: string, isKey?: boolean) => {
	if (el.$children) {
		el.$children.$deep.mounted();
		if (isKey && el.$children.key) {
			el.$children.key();
		}
		return;
	}
	Array.from(el.children).forEach((node: Element) => {
		if (componentName && node.$root && componentName === node.$root.constructor.name) {
			return mountComponentFromEl(node);
		}
	});
};

/**
 * @mountSomeComponentFromEl
 * mount some component from element
 */
export const mountSomeComponentFromEl = (oldest: Element, el: Element, componentName: string) => {
	if (el.$children) {
		let latest = findComponentNode(oldest, el);
		if (!latest) {
			el.$children.$deep.mounted();
		}
		return;
	}
	Array.from(el.children).forEach((node: Element) => {
		if (componentName && node.$root && componentName === node.$root.constructor.name) {
			return mountSomeComponentFromEl(oldest, node, componentName);
		}
	});
};

/**
 * @findComponentNode
 * find component with node
 */
export const findComponentNode = (parent: Element, item: Element) => {
	return parent.querySelector(`[data-n="${item.$name}"][data-i="${item.key}"]`);
};

/**
 * @removeRegistry
 * remove registry and call unmount
 */
function removeRegistry(component: Component, current: Component) {
	component.$deep.registry = component.$deep.registry.filter((registry) => {
		if (registry.component.constructor.name === current.constructor.name && registry.key === current.$node.key) {
			new Lifecycle(registry.component).unmount();
			return false;
		} else {
			return registry;
		}
	});
}
