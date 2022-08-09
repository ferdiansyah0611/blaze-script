let store = {};
let app = [];
let hmr = [];
let router = [];

if (import.meta.env.DEV) {
	window.store = store;
	window.app = app;
	window.hmr = hmr;
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

export const HMR = {
	get() {
		return hmr;
	},
	set(value) {
		hmr = value;
	},
	clear() {
		hmr = [];
	},
};
