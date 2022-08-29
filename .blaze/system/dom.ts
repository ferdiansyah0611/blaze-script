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

type parentType = {
	oldest: HTMLElement;
	newest: HTMLElement;
}

export const unmountAndRemoveRegistry = ({oldest, newest}: parentType, node: HTMLElement, checkingSub?: boolean, foundCallback?: Function) => {
	if(node) {
		// not component
		if(!node.$children && checkingSub) {
			Array.from(Array.from(node.children)).forEach((nodes: HTMLElement) => {
				unmountAndRemoveRegistry({oldest, newest}, nodes, true, foundCallback)
			})
			return;
		}
		// component
		else {
			if(node.key) {
				let check = findComponentNode(newest, node)
				if(!check) {
					removeRegistry(node.$root, node.$children, foundCallback)
				}
			}
		}
		return;
	}
};

/**
 * @mountComponentFromEl
 * mount from element
 */
export const mountComponentFromEl = (el: HTMLElement, componentName?: string, isKey?: boolean) => {
	if (el.$children) {
		el.$children.$deep.mounted();
		if(isKey && el.$children.key) {
			el.$children.key();
		}
		return
	}
	Array.from(el.children).forEach((node: HTMLElement) => {
		if((componentName && node.$root) && componentName === node.$root.constructor.name) {
			return mountComponentFromEl(node);
		}
	})
};

/**
 * @findComponentNode
 * find component with node
 */
export const findComponentNode = (parent: HTMLElement, item: HTMLElement) => {
	if(item.key) return parent.querySelector(`[data-n="${item.$name}"][data-i="${item.key}"]`);
	return null;
};

/**
 * @removeRegistry
 * remove registry and call unmount
 */
function removeRegistry(component: Component, current: Component, foundCallback?: Function) {
	if(component) {
		component.$deep.registry = component.$deep.registry.filter((registry) => {
			if (!(registry.component.constructor.name === current.constructor.name && registry.key === current.props.key)) {
				return registry;
			} else {
				new Lifecycle(registry.component).unmount();
				if(foundCallback) {
					foundCallback()
				}
				return false;
			}
		});
	}
}