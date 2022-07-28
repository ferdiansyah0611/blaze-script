import { escape } from "html-escaper";
import { deepObjectState } from "./core";
import { batch } from "./utils";
import { Component } from "./blaze.d";

/**
 * @childrenObserve
 * manage children element, like appendChild a node/string/number
 */
export const childrenObserve = (children: HTMLElement[], el: HTMLElement) => {
	if (children.length === 1 && typeof children[0] === "string") {
		el.append(document.createTextNode(children[0]));
	} else if (children.length) {
		children.forEach((item, i) => {
			// logic
			if (!item && typeof item !== "number") {
				return;
			}
			if (item.hasOwnProperty("if") && !item.if) {
				return;
			}
			if (item.else) {
				let previous = Array.from(children)[i - 1];
				if (previous.hasOwnProperty("if") && previous.if) {
					return;
				}
			}
			// node
			if (item && item.nodeName) {
				el.appendChild(item);
				return;
			}
			// string/number
			if (["string", "number"].includes(typeof item)) {
				el.append(document.createTextNode(item.toString()));
				return;
			}
			if (Array.isArray(item)) {
				for (const subchildren of item) {
					if (subchildren) {
						el.appendChild(subchildren);
					}
				}
			}
		});
	}
};

/**
 * @attributeObserve
 * manage attribute element, like dataset, event, etc
 */
export const attributeObserve = (data: any, el: HTMLElement, component: Component) => {
	Object.keys(data).forEach((item: any) => {
		if (item === "model") {
			let path = data[item];
			el.addEventListener("change", (e: any) => {
				deepObjectState(path, data, component, e.target.value);
			});
			el.value = deepObjectState(path, data, component);
			return;
		}
		// class
		if (item.match(/class|className/g) && Array.isArray(data[item])) {
			el.className = data[item].join(" ");
			return;
		}
		if (item === "class") {
			el.className = data[item];
			return;
		}
		// style object
		if (item === "style" && typeof data[item] === "object") {
			for (let [name, value] of Object.entries(data[item])) {
				if (typeof value === "number") {
					value = value + "px";
				}
				el.style[name] = value;
			}
			return;
		}
		// dataset
		if (item.match(/^data-/)) {
			let name = item.split("data-")[1];
			let strip = name.indexOf("-");
			if (strip !== -1) {
				name = name.slice(0, strip) + name[strip + 1].toUpperCase() + name.slice(strip + 2);
			}
			el.dataset[name] = data[item];
			return;
		}
		// refs
		if (item === "refs" && !component.$deep.update) {
			if (typeof data.i === "number") {
				if (!component[data[item]]) {
					component[data[item]] = [];
				}
				component[data[item]][data.i] = el;
			} else {
				component[data[item]] = el;
			}
			// don't return
		}
		if (item === "key") {
			el.dataset.n = component.constructor.name;
			if (["number", "string"].includes(typeof data.key)) {
				el.dataset.i = data.key;
			}
		}
		// setHTML
		if (item === "setHTML" && data[item]) {
			el.innerHTML = escape(data[item]);
			return;
		}
		// event
		if (item.match(/^on[A-Z]/)) {
			if (typeof data[item] === "function") {
				let find = item.match(/Prevent|StopPropagation|Value/);
				if (find) {
					let isValue = find[0] === "Value";
					el.addEventListener(item.split(find[0]).join("").toLowerCase().slice(2), async (e: any) => {
						e.preventDefault();
						if (!data.batch) {
							await data[item](isValue ? e.target.value : e);
						} else {
							batch(async () => await data[item](isValue ? e.target.value : e), component);
						}
					});
				} else {
					el.addEventListener(item.toLowerCase().slice(2), async (e) => {
						if (!data.batch) {
							await data[item](e);
						} else {
							batch(async () => await data[item](e), component);
						}
					});
				}
			}
			return;
		}
		// magic
		if (item === "toggle") {
			el.addEventListener("click", (e: any) => {
				e.preventDefault();
				if (data.toggle.indexOf("component.") === -1) {
					data.toggle = "component." + data.toggle;
					data.toggle += " = !" + data.toggle;
				}
				eval(data.toggle);
			});
		}
		if (item === "show") {
			if (!data[item]) {
				el.style.display = "none";
				if (el.children.length) {
					Array.from(el.children).forEach((value) => {
						value.remove();
					});
				} else {
					Array.from(el.childNodes).forEach((value) => {
						value.remove();
					});
				}
			}
		}
		el[item] = data[item];
	});
};
