import { Component } from "../blaze.d";

/**
 * @unmountAndRemoveRegistry
 * unmount and remove registery from root component
 */
export const unmountAndRemoveRegistry = (newest: Element, old: Element, checkingSub?: boolean) => {
	if (checkingSub) {
		if (old.$children) {
			let check = findComponentNode(newest, old);
			if (!check) {
				removeRegistry(old.$children.$root, old.$children);
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
		if (old.$children) {
			let check = findComponentNode(newest, old);
			if (!check) {
				removeRegistry(old.$children.$root, old.$children);
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
	if (el.$name === componentName) {
		Array.from(el.children).forEach((node: Element) => {
			return mountComponentFromEl(node, componentName, isKey);
		});
	}
};

/**
 * @mountSomeComponentFromEl
 * mount some component from element
 */
export const mountSomeComponentFromEl = (
	oldest: Element,
	el: Element,
	old: Element,
	componentName: string,
	callback: () => any,
	callbackComponent: () => any
) => {
	if (el.$children) {
		let latest = findComponentNode(oldest, el);
		if (!latest) {
			el.$children.$deep.mounted();
		}
		if (old && !old.$children) {
			callback();
		}
		if (callbackComponent) {
			callbackComponent();
		}
		return;
	}
	if (el.$name === componentName) {
		Array.from(el.children).forEach((node: Element, i: number) => {
			return mountSomeComponentFromEl(
				oldest,
				node,
				old ? old.children[i] : null,
				componentName,
				callback,
				callbackComponent
			);
		});
	}
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
export function removeRegistry(component: Component, current: Component, disableRemoveEl?: boolean) {
	let name = current.constructor.name + current.$node.key;
	let find = component.$deep.registry.value[name]
	if(find) {
		find.$deep.remove(disableRemoveEl);
		component.$deep.registry.delete(name);
	}
}

export function makeRefs(component: Component, name: string, el: Element, initial?: boolean) {
	let isArray = name.indexOf("[]") !== -1;
	let names = isArray ? name.slice(0, name.length - 2) : name;
	el.setAttribute("refs", names);
	el["refs"] = name;
	if (initial) {
		Object.defineProperty(component, names, {
			get: () => {
				if (isArray) {
					return component.$node?.querySelectorAll(`[refs="${names}"]`) || el;
				} else {
					let find = component.$node?.querySelector(`[refs="${names}"]`) || el;
					if(find && find.isConnected) {
						return find;
					}
				}
				return null;
			},
			configurable: true,
		});
	}
}
