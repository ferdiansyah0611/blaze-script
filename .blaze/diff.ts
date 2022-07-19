import _ from "lodash";
import { unmountCall } from "./core";
import { log } from "./utils";
import { Component } from "./blaze.d";

/**
 * @diff
 * diff attribute, skip, textNode, input element
 * update refs
 */
const diff = function (prev: HTMLElement, el: HTMLElement, component: Component) {
	let batch = [];
	if (!prev || !el) {
		return batch;
	}
	if (prev.nodeName !== el.nodeName) {
		batch.push(() => prev.replaceWith(el));
		return batch;
	}
	if (!prev || ((prev.d || el.d) && !(el instanceof SVGElement))) {
		return batch;
	}
	// text/button/link
	if (["SPAN", "P", "H1", "H2", "H3", "H4", "H5", "H6", "A", "BUTTON"].includes(prev.nodeName)) {
		let run = false;
		const rechange = (node, i) => {
			if (node && el.childNodes[i] !== undefined) {
				if (node.data && node.data !== el.childNodes[i].data) {
					batch.push(() => {
						log("[text]", node.data, ">", el.childNodes[i].data);
						node.replaceData(0, -1, el.childNodes[i].data);
					});
				}
			}
		};
		// same length
		if (prev.childNodes.length === el.childNodes.length) {
			prev.childNodes.forEach((node: any, i: number) => {
				if (node.data !== el.childNodes[i].data) {
					run = true;
					node.data = el.childNodes[i].data;
				}
			});
		}

		if (!run) {
			if (!prev.childNodes.length && el.childNodes.length) {
				batch.push(() => {
					el.childNodes.forEach((node: HTMLElement) => {
						prev.appendChild(node);
					});
				});
			} else {
				prev.childNodes.forEach((node: any, i: number) => {
					rechange(node, i);
				});
			}
		}
	}
	// attribute
	if (prev.attributes.length) {
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
	if (prev.refs) {
		let isConnected = prev.isConnected ? prev : el;
		if (typeof prev.i === "number") {
			if (!component[prev.refs[prev.i]]) {
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
export const diffChildren = (oldest: any, newest: any, component: Component, first: boolean = true) => {
	if (!newest) {
		return;
	} else if (oldest.for) {
		// replacing if oldest.children === 0
		if (!oldest.children.length && newest.children.length) {
			oldest.for = newest.for;
			oldest.replaceChildren(...newest.children);
			return;
		} else if (oldest.children.length && newest.children.length === 0) {
			oldest.for = newest.for;
			Array.from(oldest.children).forEach((item: HTMLElement) => {
				removeComponentOrEl(item, component);
			});
			return;
		}
		// not exists, auto delete...
		else if (newest.children.length < oldest.children.length) {
			oldest.for = newest.for;
			Array.from(oldest.children).forEach((item: HTMLElement) => {
				let latest = Array.from(newest.children).find((el: HTMLElement) => el.key === item.key);
				if (!latest) {
					removeComponentOrEl(item, component);
					return;
				}
			});
			nextDiffChildren(Array.from(oldest.children), newest, component);
			return;
		}
		// new children detection
		else if (newest.children.length > oldest.children.length) {
			oldest.for = newest.for;
			Array.from(newest.children).forEach((item: HTMLElement, i: number) => {
				let latest = Array.from(oldest.children).find((el: HTMLElement) => el.key === item.key);
				if (!latest) {
					let check = oldest.children[i];
					if (check) {
						check.insertAdjacentElement("beforebegin", item);
					} else {
						oldest.children[i - 1].insertAdjacentElement("afterend", item);
					}
					return;
				}
			});
			nextDiffChildren(Array.from(oldest.children), newest, component);
			return;
		}
		// same length children
		else {
			// checking data is different
			let difference = _.differenceWith(oldest.for, newest.for, _.isEqual);
			// replace if data different length same with newest.for.length
			if (difference.length === newest.for.length) {
				// unmount component children
				component.$deep.registry = component.$deep.registry.filter((registry) => {
					if (registry.component.$node.isConnected === false) {
						unmountCall(registry.component.$deep);
					}
				});
				oldest.for = newest.for;
				oldest.replaceChildren(...newest.children);
				return;
			}
			// updating data in children
			nextDiffChildren(Array.from(oldest.children), newest, component);
			return;
		}
	} else if (_.isBoolean(oldest.show)) {
		if (!newest.show) {
			oldest.remove();
		}
	} else if ((oldest.$name || newest.$name) !== component.constructor.name) {
		return;
	} else if (oldest.children.length !== newest.children.length) {
		return oldest.replaceChildren(...newest.children);
	} else {
		if (first) {
			let difference = diff(oldest, newest, component);
			difference.forEach((rechange: Function) => rechange());
		}
		nextDiffChildren(Array.from(oldest.children), newest, component);
	}
};

function nextDiffChildren(children: HTMLElement[], newest: any, component: Component) {
	children.forEach((item: HTMLElement, i: number) => {
		let difference = diff(item, newest.children[i], component);
		difference.forEach((rechange: Function) => rechange());
		diffChildren(item, newest.children[i], component, false);
	});
}

function removeComponentOrEl(item: HTMLElement, component: Component) {
	if (item.dataset.component) {
		let check = component.$deep.registry.find(
			(registry) =>
				registry.component.constructor.name === item.dataset.component &&
				registry.key === parseInt(item.dataset.key)
		);
		if (check) {
			check.component.$deep.remove();
			component.$deep.registry = component.$deep.registry.filter(
				(registry) =>
					!(
						registry.component.constructor.name === item.dataset.component &&
						registry.key === parseInt(item.dataset.key)
					)
			);
		} else {
			item.remove();
		}
	} else {
		item.remove();
	}
}
export default diff;
