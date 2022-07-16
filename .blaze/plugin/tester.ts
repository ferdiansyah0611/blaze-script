import _ from "lodash";

export default class Tester {
	component: any;
	result: any[];
	constructor(component) {
		this.component = component;
		this.result = [];
	}
	getLastResult = () => {
		return this.result.at(-1);
	};
	addToItStatus = (message, result) => {
		let last = this.getLastResult().it.at(-1);
		if (last) {
			if (result) {
				last.success.push(message);
			} else {
				last.error.push(message);
			}
		}
	};
	done = () => {
		this.component.$deep.test = {
			result: this.result,
			finished: true
		}
	}
	describe = (description, callback) => {
		this.result.push({
			description,
			it: [],
		});
		callback();
	};
	it = (description, callback) => {
		this.getLastResult().it.push({
			description,
			success: [],
			error: [],
		});
		callback();
	};
	query = (name) => {
		let el = this.component.$node.querySelector(name);
		let current = this;
		return {
			...el,
			event(eventName) {
				el[eventName]();
				return this;
			},
			expect(property, value) {
				current.addToItStatus('[expect] ' + value, el[property] === value);
				return this;
			},
		};
	};
	data = (path) => {
		let current = this;
		let value;
		let split = path.split(".");
		split.forEach((name: string, i: number) => {
			if (!i) {
				value = this.component[name];
			} else {
				value = value[name];
			}
		});
		return {
			toBe(expect) {
				current.addToItStatus('[toBe] ' + expect, value === expect);
				return this;
			},
			toEqual(expect) {
				let equal = _.isEqualWith(value, expect, function (val1, val2): any {
					if (_.isFunction(val1) && _.isFunction(val2)) {
						return val1.toString() === val2.toString();
					}
				});
				current.addToItStatus('[toEqual] ' + expect, equal);
				return this;
			},
			sameType(expect) {
				current.addToItStatus('[sameType] ' + expect, typeof value === expect);
				return this;
			},
		};
	};
}

export const withTest = (callback) => {
	const list = [];
	const to = (name, callbackTest) => {
		list.push({
			name,
			callback: callbackTest
		})
	}
	callback(to)

	window.$test = list;

	return() => {}
}
