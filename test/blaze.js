import diff from "./diff";
import { log, render, state, watch, batch, mount, refs, App } from "./utils";
import {
	childrenUtilites,
	getPreviousUtilites,
	attributeUtilites,
} from "./core";

export { log, render, state, watch, mount, refs, batch };
export default App;

export const e = function (first, component, nodeName, data, ...children) {
	let text;
	let $deep = component.$deep;
	data = data ?? {};
	// component
	if (typeof nodeName === "function") {
		let key = data.key ?? 0;
		let check = $deep.registry.find(
			(item) =>
				item.component.constructor.name === nodeName.name &&
				item.key === key
		);
		// registry component
		if (!check) {
			let current = new nodeName(component);
			// props registery
			state("props", data.props || {}, current);

			current.$node = current.render();
			current.$node.dataset.key = key;
			current.$node.childrenComponent = component;
			$deep.registry.push({
				key,
				component: current,
			});
			current.$node.render = false;
			return current.$node;
		}

		check.component.$deep.mount.handle(data.props, true);
		if (
			!check.component.$node.isConnected &&
			check.component.$node.render
		) {
			log("not connect", check.component.$node.render);
			check.component.$deep.unmount();
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
	childrenUtilites(children, el, $deep);
	attributeUtilites(first, data, el, $deep, component);
	// first render
	if (!$deep.update) {
		if (!$deep.$id) {
			$deep.$id = 1;
		}

		if (first) {
			if ($deep.mount && el.isConnected) {
				$deep.mount.handle();
			}
			el.dataset.component = component.constructor.name;
		}
		$deep.node.push({
			key: $deep.$id,
			el,
		});
		$deep.$id++;
		return el;
	}
	// update render
	else {
		// diff in here
		let prev = getPreviousUtilites(first, $deep, el);
		if (!first) {
			let difference = diff(prev, el);
			difference.forEach((batch) => {
				batch();
			});
			$deep.$id++;
			return prev;
		}
		if (first && prev) {
			if (prev.dataset && prev.childrenComponent) {
				let dataset = prev.dataset;
				let check = prev.childrenComponent.$deep.registry.find(
					(item) =>
						item.component.constructor.name === dataset.component &&
						item.key === Number(dataset.key)
				);
				if (check && check.component.$node.isConnected) {
					check.component.$node.render = true;
					check.component.$deep.mount.handle();
				}
			}
		}
	}
};

// setup
export const init = (component) => {
	if (!component.$deep) {
		component.$deep = {
			batch: false,
			node: [],
			registry: [],
			watch: [],
			update: 0,
			mount: {
				run: false,
				handle: (props) => false,
			},
			trigger: () => {
				component.$deep.update++;
				component.$deep.$id = 1;
				component.render();
			},
		};

		component.props = {};
		component.$h = jsx(component);
	}
};
export const jsx = (component) => {
	return {
		h: (...arg) => {
			return e(false, component, ...arg);
		},
		Fragment: "Fragment",
	};
};
