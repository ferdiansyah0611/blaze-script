import { log } from "./utils";

const diff = function (prev: HTMLElement, el: HTMLElement) {
	let batch = [];
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
	// input
	if (prev.value !== el.value) {
		batch.push(() => (prev.value = el.value));
	}

	return batch;
};

export const diffChildren = (oldest: any, newest: any, first: boolean = true) => {
	if (!newest) {
		return;
	}
	if (oldest.children.length !== newest.children.length) {
		return oldest.replaceChildren(...newest.children);
	} else {
		let children = Array.from(oldest.children);
		if (first) {
			let difference = diff(oldest, newest);
			difference.forEach((rechange) => rechange());
		}
		children.forEach((item: HTMLElement, i: number) => {
			let difference = diff(item, newest.children[i]);
			difference.forEach((rechange) => rechange());
			diffChildren(item, newest.children[i], false);
		});
	}
};

export default diff;
