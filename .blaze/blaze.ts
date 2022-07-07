import diff from "./diff";
import {
	log,
	render,
	state,
	watch,
	batch,
	mount,
	refs,
	context,
	App,
	getBlaze
} from "./utils";
import {
	childrenUtilites,
	getPreviousUtilites,
	attributeUtilites,
	mountUtilities,
	unmountUtilities,
	init,
} from "./core";
import { Component, RegisteryComponent } from "./blaze.d";

export { log, render, state, watch, mount, refs, batch, init, context };
export default App;

export const e = function (
	first: boolean,
	component: Component,
	nodeName: string | Function | any,
	data: any,
	...children: HTMLElement[]
) {
	const $deep = component.$deep;
	data = data ?? {};
	// component
	if (typeof nodeName === "function") {
		let key = data.key ?? 0;
		let check = $deep.registry.find(
			(item: RegisteryComponent) =>
				item.component.constructor.name === nodeName.name &&
				item.key === key
		);
		// registry component
		if (!check) {
			let current = new nodeName(component, window.$app);
			// props registery
			state("props", data ? {...data} : {}, current);

			current.$node = current.render();
			current.$node.dataset.key = key;
			current.$node.childrenComponent = component;
			$deep.registry.push({
				key,
				component: current,
			});
			current.$node.render = false;
			getBlaze().runEveryMakeComponent(current);
			mountUtilities(current.$deep, true);
			return current.$node;
		}

		mountUtilities(check.component.$deep, data.props, true);
		if (
			!check.component.$node.isConnected &&
			check.component.$node.render
		) {
			unmountUtilities(check.component.$deep);
			$deep.registry = $deep.registry.filter((item) => item.key !== key);
		}
		return check.component.$node;
	}
	// fragment
	if (nodeName === "Fragment") {
		nodeName = "div";
		first = true;
	}
	// element
	let el = document.createElement(nodeName);
	let current = getPreviousUtilites(first, $deep, el);

	childrenUtilites(children, el, $deep, current);
	attributeUtilites(data, el, $deep, component, current);
	// first render
	if (!$deep.update) {
		if (first) {
			if (el.isConnected) {
				mountUtilities($deep, data.props, true);
			}
			el.dataset.component = component.constructor.name;
		}
		$deep.node.push({
			key: $deep.$id,
			el,
		});
		getBlaze().runEveryMakeElement(el);
		$deep.$id++;
		return el;
	}
	// update render
	else {
		// diff in here
		if (!first) {
			let difference = diff(current, el);
			difference.forEach((batch) => {
				batch();
			});
			$deep.$id++;
			getBlaze().runEveryMakeElement(current);
			return current;
		}
		if (first && current) {
			if (current.dataset && current.childrenComponent) {
				let dataset = current.dataset;
				let check = current.childrenComponent.$deep.registry.find(
					(item) =>
						item.component.constructor.name === dataset.component &&
						item.key === Number(dataset.key)
				);
				if (check && check.component.$node.isConnected) {
					check.component.$node.render = true;
					mountUtilities(check.component.$deep, data.props, true);
				}
			}
		}
	}
};
