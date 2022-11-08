import { Component } from "../blaze.d";

export interface findOption{
	parent: Element;
	item: Element;
}
export interface makeRefsOption{
	component: Component;
	name: string;
	el: Element;
	isInitial?: boolean;
}
export interface mountComponentOption{
	el: ChildNode;
	name?: string;
	isKey?: boolean;
}
export interface mountComponentElementOption{
	parentReal: Element;
	el: Element;
	current: ChildNode;
	name: string;
	callback?: () => any;
	callbackComponent?: () => any;
}
export interface destroyComponentOption{
	parentFake: Element;
	active: Element;
	isCheckSub?: boolean;
	isDisableRemove?: boolean;
}
export interface destroyRegistryOption{
	parent: Component;
	active: Component;
	isDisableRemove?: boolean;
}

const Dom: {
	find?: (option: findOption) => any;
	makeRefs?: (option: makeRefsOption) => any;
	mountComponent?: (option: mountComponentOption) => any;
	mountComponentElement?: (option: mountComponentElementOption) => any;
	destroyComponent?: (option: destroyComponentOption) => any;
	destroyRegistry?: (option: destroyRegistryOption) => any;
} = {};

/**
 * @find
 * find component with node
 */
Dom.find = function (option: findOption) {
	const { parent, item } = option;
	return parent.querySelector(`[data-n="${item.$name}"][data-i="${item.key}"]`);
};

/**
 * @makeRefs
 * handling refs a element
 */
Dom.makeRefs = function (option: makeRefsOption) {
	const { component, name, el, isInitial } = option;
	let isArray = name.indexOf("[]") !== -1;
	let names = isArray ? name.slice(0, name.length - 2) : name;
	el.setAttribute("refs", names);
	el["refs"] = name;
	if (isInitial) {
		Object.defineProperty(component, names, {
			get: () => {
				if (isArray) {
					return component.$node?.querySelectorAll(`[refs="${names}"]`) || el;
				} else {
					let find = component.$node?.querySelector(`[refs="${names}"]`) || el;
					if (find && find.isConnected) {
						return find;
					}
				}
				return null;
			},
			configurable: true,
		});
	}
};

/**
 * @mountComponent
 * mount all component from element
 */
Dom.mountComponent = function (option: mountComponentOption) {
	const { el, name, isKey } = option
	if (el["$children"]) {
		el["$children"].$deep.mounted();
		if (isKey && el["$children"].key) {
			el["$children"].key();
		}
		return;
	}
	if (el["$name"] === name) {
		Array.from(el["children"]).forEach((node: Element) => {
			return Dom.mountComponent({ el: node, name, isKey });
		});
	}
};

/**
 * @mountComponentElement
 * mount some component from element
 */
Dom.mountComponentElement = function (option: mountComponentElementOption) {
	const {parentReal, el, current, name, callback, callbackComponent} = option
	if (el.$children) {
		let latest = Dom.find({ parent: parentReal, item: el });
		if (!latest) {
			el.$children.$deep.mounted();
		}
		if (current && !current["$children"]) {
			callback && callback();
		}
		if (callbackComponent) {
			callbackComponent();
		}
		return;
	}
	if (el.$name === name) {
		Array.from(el.children).forEach((node: Element, i: number) => {
			return Dom.mountComponentElement({
				parentReal,
				el: node,
				current: current ? current["children"][i] : null,
				name,
				callback,
				callbackComponent
			})
		});
	}
}

/**
 * @destroyComponent
 * unmount and remove registery from root component
 */
Dom.destroyComponent = function (option: destroyComponentOption) {
	const { parentFake, active, isCheckSub, isDisableRemove } = option;
	if (isCheckSub) {
		if (active.$children) {
			let check = Dom.find({ parent: parentFake, item: active })
			if (!check) {
				Dom.destroyRegistry({ parent: active.$children.$root, active: active.$children, isDisableRemove })
			}
			return;
		}
	}
	// not component
	if (!active.$children && isCheckSub) {
		Array.from(active.childNodes).forEach((actives: Element) => {
			Dom.destroyComponent({
				parentFake, active: actives, isCheckSub, isDisableRemove
			});
		});
		return;
	}
	// component
	else {
		if (active.$children) {
			let check = Dom.find({ parent: parentFake, item: active })
			if (!check) {
				Dom.destroyRegistry({ parent: active.$children.$root, active: active.$children, isDisableRemove })
			}
		}
	}
	return;
};

/**
 * @destroyRegistry
 * remove registry and call unmount
 */
Dom.destroyRegistry = function (option: destroyRegistryOption) {
	const { parent, active, isDisableRemove } = option;
	let name = active.constructor.name + active.$node.key;
	let find = parent.$deep.registry.value[name];
	if (find) {
		find.$deep.remove(isDisableRemove);
		parent.$deep.registry.delete(name);
	}
};

export default Dom;