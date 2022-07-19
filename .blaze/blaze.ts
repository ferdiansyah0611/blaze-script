import _ from "lodash";
import { log, render, state, watch, batch, mount, layout, created, beforeUpdate, updated, context, dispatch, App, getBlaze } from "./utils";
import {
	childrenObserve,
	attributeObserve,
	mountCall,
	unmountCall,
	layoutCall,
	rendering,
	init,
} from "./core";
import { Component, RegisteryComponent } from "./blaze.d";
import { diffChildren } from "./diff";
// export
export { log, render, state, watch, mount, layout, created, beforeUpdate, updated, batch, dispatch, init, context };
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
			let newComponent = new nodeName(component, window.$app);
			// props registery
			state("props", data ? { ...data } : {}, newComponent);
			const result = rendering(newComponent, $deep, true, true, data, key, nodeName, children);
			return result;
		}
		/**
		 * @lifecycle
		 * call lifecycle component
		 * check equal old props with new props, if different then change old props to new props
		 */
		mountCall(check.component.$deep, data.props, true);
		if (!check.component.$node.isConnected && check.component.$node.render) {
			unmountCall(check.component.$deep);
			$deep.registry = $deep.registry.filter((item) => (item.component.constructor.name === check.component.constructor.name) && (item.key !== key));
		}

		let propsObject = { ...check.component.props };
		let equal = _.isEqualWith(propsObject, { ...data, _isProxy: true }, function (val1, val2): any {
			if (_.isFunction(val1) && _.isFunction(val2)) {
				return val1.toString() === val2.toString();
			}
		});

		if (equal === false) {
			state("props", data ? { ...data } : {}, check.component);
		}

		const result = rendering(check.component, $deep, false, false, data, key, nodeName, children);
		diffChildren(check.component.$node, result, check.component);
		return result;
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
		if (first && current) {
			layoutCall($deep);
			if (current.dataset && current.$children) {
				let dataset = current.dataset;
				let check = current.$children.$deep.registry.find(
					(item) => item.component.constructor.name === dataset.component && item.key === Number(dataset.key)
				);
				if (check && check.component.$node.isConnected) {
					mountCall(check.component.$deep, data.props, true);
				}
			}
		}
		return el;
	}
};
