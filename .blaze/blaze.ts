import _ from "lodash";
import { log, render, state, watch, batch, mount, layout, context, dispatch, App, getBlaze } from "./utils";
import {
	childrenObserve,
	attributeObserve,
	mountCall,
	unmountCall,
	layoutCall,
	init,
} from "./core";
import { Component, RegisteryComponent } from "./blaze.d";
// extension
import { addLog } from "@root/plugin/extension";
// export
export { log, render, state, watch, mount, layout, batch, dispatch, init, context };
export default App;

/**
 * @createElement
 * createElement for blaze
 * @return HTMLElement
 */
export const e = function (
	first: boolean,
	component: Component,
	nodeName: string | Function | any,
	data: any,
	...children: HTMLElement[]
) {
	/**
	 * @delcaration
	 */
	const $deep = component.$deep;
	const current = component.$node;

	let el;

	if (!data) {
		data = {};
	}

	/**
	 * @component
	 * check component if not exist add to registery $deep, rendering, and lifecycle. if exists and props has changed are will trigger
	 */
	if (_.isFunction(nodeName)) {
		let key = data.key ?? 0;
		let check = $deep.registry.find(
			(item: RegisteryComponent) => item.component.constructor.name === nodeName.name && item.key === key
		);
		/**
		 * @registry
		 */
		if (!check) {
			let old = performance.now(),
				now,
				duration,
				msg,
				warn;
			let newComponent = new nodeName(component, window.$app);
			// props registery
			state("props", data ? { ...data } : {}, newComponent);
			// rendering
			newComponent.$node = newComponent.render();
			newComponent.$node.dataset.key = key;
			newComponent.$node.childrenComponent = component;
			$deep.registry.push({
				key,
				component: newComponent,
			});
			newComponent.$node.render = false;
			// mount
			getBlaze().runEveryMakeComponent(newComponent);
			mountCall(newComponent.$deep, true);
			// warning
			if (!data.key) {
				warn = `[${nodeName.name}] key is 0. it's work, but add key property if have more on this component.`;
				console.warn(warn);
			}
			// timer
			now = performance.now();
			duration = (now - old).toFixed(1);
			msg = `[${nodeName.name}] ${duration}ms`;
			newComponent.$deep.time = duration;
			// extension
			if (window.$extension) {
				batch(() => {
					addLog(
						{
							msg,
						},
						false
					);
					if (warn) {
						addLog(
							{
								msg: warn,
								type: "warn",
							},
							false
						);
					}
				}, window.$extension);
			}
			return newComponent.$node;
		}
		/**
		 * @lifecycle
		 * call lifecycle component
		 * check equal old props with new props, if different then call trigger
		 */
		mountCall(check.component.$deep, data.props, true);
		if (!check.component.$node.isConnected && check.component.$node.render) {
			unmountCall(check.component.$deep);
			$deep.registry = $deep.registry.filter((item) => item.key !== key);
		}

		let propsObject = { ...check.component.props };
		let equal = _.isEqualWith(propsObject, { ...data, _isProxy: true }, function (val1, val2): any {
			if (_.isFunction(val1) && _.isFunction(val2)) {
				return val1.toString() === val2.toString();
			}
		});

		if (!equal) {
			state("props", data ? { ...data } : {}, check.component);
			check.component.$deep.trigger();
		}
		return check.component.$node;
	}

	/**
	 * @fragment
	 * logic if node is fragment/first element on component
	 */
	const fragment = () => {
		if (nodeName === "Fragment") {
			nodeName = "div";
			first = true;
		}
	};

	/**
	 * @makeElement
	 * create element, svg and observe data property
	 */
	const makeElement = () => {
		let svg;
		let componentName = component.constructor.name;
		if (["svg", "path", "g", "circle", "ellipse", "line"].includes(nodeName) || data.svg) {
			svg = true;
			el = document.createElementNS("http://www.w3.org/2000/svg", nodeName);
			for (const [k, v] of Object.entries(data)) {
				el.setAttribute(k, v);
			}
		} else {
			el = document.createElement(nodeName);
		}
		childrenObserve(children, el, $deep);
		if (!svg) attributeObserve(data, el, component);
		if (first) el.dataset.component = componentName;
		el.$name = componentName;
		getBlaze().runEveryMakeElement(el);
		return el;
	};
	/**
	 * @call fragment, makeElement
	 */
	fragment();
	makeElement();

	/**
	 * @render
	 * first rendering and call lifecycle function in fragment/first element
	 */
	if (!$deep.update) {
		if (first) {
			if (el.isConnected) {
				mountCall($deep, data.props, true);
			}
			layoutCall($deep);
		}
		return el;
	} else {
		/**
		 * @updateRender
		 * update element on props/state change and call lifecycle function
		 */
		if (el.for && component.$deep.update) {
			el.$children = el.cloneNode(true)
		}
		if (first && current) {
			layoutCall($deep);

			if (current.dataset && current.childrenComponent) {
				let dataset = current.dataset;
				let check = current.childrenComponent.$deep.registry.find(
					(item) => item.component.constructor.name === dataset.component && item.key === Number(dataset.key)
				);
				if (check && check.component.$node.isConnected) {
					check.component.$node.render = true;
					mountCall(check.component.$deep, data.props, true);
				}
			}
		}
		return el;
	}
};
