let store = {};
let app = [];
let router = [];

if (import.meta.env.DEV) {
	window.store = store;
	window.app = app;
}

export const Store = {
	get() {
		return store;
	},
	set(name, value) {
		store[name] = value;
	},
};

export const App = {
	get(id?: number, select?: string) {
		if (id >= 0) {
			if (select) return app[id][select];
			return app[id];
		}
		return app;
	},
	set(value) {
		app.push(Object.seal(value));
	},
};

export const Router = {
	get(id?: number) {
		if (id >= 0) {
			return router[id];
		}
		return router;
	},
	set(value) {
		router.push(value);
	},
};

class HMRClass {
	data: any[];
	constructor() {
		this.data = [];
		if(import.meta.env.DEV) {
			window.hmr = this;
		}
	}
	get() {
		return this.data;
	}
	set(value) {
		let isFound
		let call = (data) => {
			this.data = this.data.map((hmrs) => {
				if(hmrs.name === data.name) {
					hmrs = data;
					isFound = true
				}
				return hmrs;
			})
			if(!isFound) {
				isFound = false;
				this.data.push(data);
			}
		}

		if(!this.data.length) {
			return this.data = value;
		}
		if(Array.isArray(value)) {
			value.forEach(call);
		}
		else {
			call(value);
		}
	}
	find(name) {
		return this.data.find(data => data.name === name)
	}
	clear() {
		this.data = [];
	}
}

export const HMR = new HMRClass()