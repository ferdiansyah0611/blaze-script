import _ from "lodash";
import { log } from "./utils";
import { Component } from "./blaze.d"

/**
 * @diff
 * diff attribute, skip, textNode, input element
 * update refs
 */
const diff = function (prev: HTMLElement, el: HTMLElement, component: Component) {
	let batch = [];
	if(!prev || !el) {
		return batch;
	}
	if(prev.nodeName !== el.nodeName) {
		batch.push(() => prev.replaceWith(el))
		return batch;
	}
	if (!prev || ((prev.d || el.d) && !(el instanceof SVGElement))) {
		return batch;
	}
	// text/button/link
	if (prev.nodeName.match(/SPAN|P|H1|H2|H3|H4|H5|H6|A|BUTTON/)) {
		if (!prev.childNodes.length && el.childNodes.length) {
			el.childNodes.forEach((node: HTMLElement) => {
				prev.appendChild(node);
			});
		} else {
			prev.childNodes.forEach((node: any, i: number) => {
				if (node && el.childNodes[i] !== undefined) {
					if (node.data && node.data !== el.childNodes[i].data) {
						batch.push(() => {
							log("[text]", node.data, ">", el.childNodes[i].data);
							node.replaceData(0, -1, el.childNodes[i].data);
						});
					}
				}
			});
		}
	}
	// attribute
	if (prev.attributes.length) {
		if (typeof prev.if === "boolean") {
			if (prev.if) {
				batch.push(() => prev.removeAttribute("style"));
			}
		}
		batch.push(() => {
			for (var i = 0; i < prev.attributes.length; i++) {
				if (prev.attributes[i] && el.attributes[i] && prev.attributes[i].name === el.attributes[i].name) {
					if (prev.attributes[i].value !== el.attributes[i].value) {
						log("[different]", prev.attributes[i].value, el.attributes[i].value);
						prev.attributes[i].value = el.attributes[i].value;
					}
				}
			}
		});
	}
	// update refs if updated
	if(prev.refs) {
		let isConnected = prev.isConnected ? prev: el
		if (typeof prev.i === "number") {
			if(!component[prev.refs[prev.i]]) {
				component[prev.refs[prev.i]] = [];
			}
			component[prev.refs][prev.i] = isConnected;
		} else {
			component[prev.refs] = isConnected;
		}
	}
	// input
	if (prev.value !== el.value) {
		batch.push(() => (prev.value = el.value));
	}

	return batch;
};

/**
 * @diffChildren
 * diffing children component
 * replaceChildren if old el with new el is different
 * skip diff if el not different with current component
 * and diff element
 */
export const diffChildren = (oldest: any, newest: any,  component: Component, first: boolean = true) => {
	if (!newest) {
		return;
	}
	else if(oldest.for){
		const getValueState = () => {
			let value
			oldest.for.split('.').forEach((name: string, i: number) => {
				if (!i) {
					value = component[name];
				} else {
					value = value[name];
				}
			});
			return value
		}
		if ((!oldest.$children) || (oldest.$children.children.length !== newest.$children.children.length)) {
			oldest.replaceChildren(...newest.children);
			oldest.$children = newest.$children
			let value
			oldest.for.split('.').forEach((name: string, i: number) => {
				if (!i) {
					value = component[name];
				} else {
					value = value[name];
				}
			});

			oldest.$state = getValueState()
			return;
		} else {
			let value = getValueState();
			if(!oldest.$has) {
				oldest.replaceChildren(...newest.$children.children)
				oldest.$has = true
				return
			} else {
				let difference = _.differenceWith(value, oldest.$state, _.isEqual)
				difference.forEach((item: any) => {
					let old = oldest.querySelector(`[data-key="${item[oldest.key]}"]`)
					let now = newest.querySelector(`[data-key="${item[oldest.key]}"]`)
					if(old && now) {
						oldest.replaceChild(now, old)
					} else {
						// insert
						let find = oldest.$state.findIndex((items: any) => items[oldest.key] === item[oldest.key])
						oldest.insertBefore(now, oldest.children[find]);
					}
				})
				oldest.$children = oldest.cloneNode(true)
				oldest.$state = value
			}
			return;
		}
	}
	else if((oldest.$name || newest.$name) !== component.constructor.name) {
		return;
	}
	else if (oldest.children.length !== newest.children.length) {
		return oldest.replaceChildren(...newest.children);
	}
	else {
		let children = Array.from(oldest.children);
		if (first) {
			let difference = diff(oldest, newest, component);
			difference.forEach((rechange: Function) => rechange());
		}
		children.forEach((item: HTMLElement, i: number) => {
			let difference = diff(item, newest.children[i], component);
			difference.forEach((rechange: Function) => rechange());
			diffChildren(item, newest.children[i], component, false);
		});
	}
};

export default diff;
