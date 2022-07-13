import { log, render, state, watch, batch, mount, refs, context, dispatch, App, getBlaze } from "./utils";
import {
	childrenUtilites,
	getPreviousUtilites,
	attributeUtilites,
	mountUtilities,
	unmountUtilities,
	init,
} from "./core";
import { Component, RegisteryComponent } from "./blaze.d";
import { addLog } from '@root/plugin/extension';
import _ from 'lodash'

export { log, render, state, watch, mount, refs, batch, dispatch, init, context };
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
			(item: RegisteryComponent) => item.component.constructor.name === nodeName.name && item.key === key
		);
		// registry component
		if (!check) {
			let old = performance.now(), now, duration, msg, warn;
			let current = new nodeName(component, window.$app);
			// props registery
			state("props", data ? { ...data } : {}, current);
			// rendering
			current.$node = current.render();
			current.$node.dataset.key = key;
			current.$node.childrenComponent = component;
			$deep.registry.push({
				key,
				component: current,
			});
			current.$node.render = false;
			// mount
			getBlaze().runEveryMakeComponent(current);
			mountUtilities(current.$deep, true);
			// warning
			if(!data.key) {
				warn = `[${nodeName.name}] key is 0. it's work, but add key property if have more on this component.`;
				console.warn(warn);
			}
			// timer
			now = performance.now();
			duration = (now - old).toFixed(1);
			msg = `[${nodeName.name}] ${duration}ms`;
			current.$deep.time = duration;
			// extension
			if(window.$extension) {
				batch(() => {
					addLog({
						msg,
					}, false);
					if(warn) {
						addLog({
							msg: warn,
							type: 'warn'
						}, false);
					}
				}, window.$extension)
			}
			// node
			return current.$node;
		}
		// update component

		// mount component
		mountUtilities(check.component.$deep, data.props, true);
		// unmount component
		if (!check.component.$node.isConnected && check.component.$node.render) {
			unmountUtilities(check.component.$deep);
			$deep.registry = $deep.registry.filter((item) => item.key !== key);
		}
		// check equal props
		let propsObject = {...check.component.props}
		let equal = _.isEqual(propsObject, {...data, _isProxy: true})
		if(!equal) {
			state("props", data ? { ...data } : {}, check.component);
			check.component.$deep.trigger()
		}
		return check.component.$node;
	}
	// fragment
	if (nodeName === "Fragment") {
		nodeName = "div";
		first = true;
	}
	let el;
	// only svg element
	let svg;
	if (["svg", "path", "g", "circle", "ellipse", "line"].includes(nodeName)) {
		svg = true;
		el = document.createElementNS("http://www.w3.org/2000/svg", nodeName);
		for (const [k, v] of Object.entries(data)) {
			el.setAttribute(k, v);
		}
	}
	// element
	else {
		el = document.createElement(nodeName);
	}
	let current = getPreviousUtilites(first, $deep, component, el);

	childrenUtilites(children, el, $deep);

	if (!svg) {
		attributeUtilites(data, el, component, current);
	}
	(() => {
		if (first) el.dataset.component = component.constructor.name;
	})();
	getBlaze().runEveryMakeElement(el);
	// first render
	if (!$deep.update) {
		if (first) {
			if (el.isConnected) {
				mountUtilities($deep, data.props, true);
			}
		}
		return el;
	}
	// update render
	else {
		if (!first) {
			return el;
		}
		if (first && current) {
			if (current.dataset && current.childrenComponent) {
				let dataset = current.dataset;
				let check = current.childrenComponent.$deep.registry.find(
					(item) => item.component.constructor.name === dataset.component && item.key === Number(dataset.key)
				);
				if (check && check.component.$node.isConnected) {
					check.component.$node.render = true;
					mountUtilities(check.component.$deep, data.props, true);
				}
			}
		}
		return el;
	}
};
