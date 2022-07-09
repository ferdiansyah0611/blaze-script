import { mountUtilities } from "./core";
import { mount } from "@blaze";
import { Component } from "./blaze.d";

export const makeRouter = (entry: string, config: any) => {
	let popstate = false;
	if(config.resolve) {
		let url = new URL(location.href);

		/*let update = */config.url.map(item => {
			if(item.path){
				item.path = url.pathname + (item.path === '/' ? '' : item.path)
			}
			return item
		})
	}

	const goto = (app: any, url: string, component: any, params?: any) => {
		if (popstate) {
			history.replaceState(null, "", url);
		} else {
			history.pushState(null, "", url);
		}
		popstate = false;

		let current = new component(Object.assign(app, { params }));
		// props registery
		current.$node = current.render();
		current.$node.render = false;

		mountUtilities(current.$deep, true);
		document.querySelector(entry).append(current.$node);
		app.$router.history.forEach((data) => {
			data.current.$deep.remove();
		});
		app.$router.history.push({ url, current });
	};

	const ready = (app: any, url: string = new URL(location.href).pathname) => {
		let routes = config.url.find((v: any) => v.path === url),
			component: string = "",
			params: any = {},
			found: any;

		const validation = () => {
			if (routes) {
				component = routes.component;
				found = routes;
				return true;
			} else {
				const pathRegex = (path: string) =>
					new RegExp(
						"^" +
							path
								.replace(/\//g, "\\/")
								.replace(/:\w+/g, "(.+)") +
							"$"
					);
				const potentialMatched = config.url.map((route: any) => {
					return {
						route,
						result: url.match(pathRegex(route.path)),
					};
				});
				let match = potentialMatched.find(
					(potentialMatch: any) => potentialMatch.result !== null
				);
				if (!match) {
					if (routes) {
						match = {
							route: routes[0],
							result: [url],
						};
					} else {
						let current = config.url.find(
							(path) => path.path.length === 0
						);
						component = current.component;
						found = current;
						console.warn("404", ">", url);
						goto(app, url, component);
						return false;
					}
				}
				const getParams = (match: any) => {
					const values = match.result.slice(1);
					const keys = Array.from(
						match.route.path.matchAll(/:(\w+)/g)
					).map((result: any) => result[1]);
					return Object.fromEntries(
						keys.map((key: any, i: number) => {
							return [key, values[i]];
						})
					);
				};
				params = getParams(match);
				found = match.route;
				return true;
			}
		};
		if (validation()) {
			console.log(">", url, "GET [200]");
			return goto(app, url, found.component, params);
		}
	};
	return (app: Component, blaze) => {
		// setup
		let tool = {
			history: [],
			go(goNumber: number) {
				history.go(goNumber);
			},
			back: () => {
				history.back();
			},
			push: (url: string) => {
				if (!(url === location.pathname)) {
					ready(app, url);
				}
			},
		};
		app.$router = tool;

		blaze.onMakeElement = (el: any) => {
			if (el && el.nodeName === "A" && el.dataset.link && !el.isRouter) {
				if(config.resolve){
					let url = new URL(el.href);
					el.dataset.href = url.origin + config.resolve + (url.pathname === '/' ? '' : url.pathname)
				}
				el.addEventListener("click", (e: any) => {
					e.preventDefault();
					tool.push(new URL(config.resolve ? e.currentTarget.dataset.href: el.href).pathname);
				});
				el.isRouter = true;
			}
		};
		blaze.onMakeComponent = (component) => {
			component.$router = tool;
		};
		// mount
		mount(() => {
			ready(app);
			window.addEventListener("popstate", () => {
				popstate = true;
				ready(app, location.pathname);
			});
		}, app);
	};
};
export const page = (path: string, component: any, config: any = {}) => ({
	path,
	component,
	config,
});
