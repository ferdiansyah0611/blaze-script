import { Component, Mount } from "../blaze.d";

export default class Lifecycle {
	component: Component;
	error: any;
	constructor(component) {
		this.component = component;
		this.error = window.$error;
	}
	/**
	 * @mount
	 * for run mount lifecycle
	 */
	mount(props: any, update?: boolean, enabled?: boolean) {
		const { error } = this;
		const { $deep } = this.component;
		try {
			if (!$deep.hasMount) {
				$deep.mount.forEach((item: Mount) => item.handle(props, update, enabled));
				$deep.hasMount = true;
			}
		} catch (err) {
			if (error) {
				error.open(`Error Mount`, err.stack);
			}
		}
	}
	/**
	 * @unmount
	 * for run unmount lifecycle
	 */
	unmount() {
		const { error } = this;
		const { $deep } = this.component;
		try {
			$deep.unmount.forEach((item: Function) => typeof item === "function" && item());
		} catch (err) {
			if (error) {
				error.open(`Error Unmount`, err.stack);
			}
		}
	}
	/**
	 * @layout
	 * for run layout lifecycle
	 */
	layout() {
		const { error } = this;
		const { $deep } = this.component;
		try {
			if ($deep.layout) $deep.layout.forEach((item: Function) => item());
		} catch (err) {
			if (error) {
				error.open(`Error Layout`, err.stack);
			}
		}
	}
	/**
	 * @beforeCreate
	 * for run before update data lifecycle
	 */
	beforeCreate() {
		const { error } = this;
		const { $deep } = this.component;
		try {
			if ($deep.beforeCreate) $deep.beforeCreate.forEach((item: Function) => item());
		} catch (err) {
			if (error) {
				error.open(`Error beforeCreate`, err.stack);
			}
		}
	}
	/**
	 * @created
	 * for run created lifecycle
	 */
	created() {
		const { error } = this;
		const { $deep } = this.component;
		try {
			if ($deep.created) $deep.created.forEach((item: Function) => item());
		} catch (err) {
			if (error) {
				error.open(`Error Created`, err.stack);
			}
		}
	}
	/**
	 * @beforeUpdate
	 * for run before update data lifecycle
	 */
	beforeUpdate() {
		const { error } = this;
		const { $deep } = this.component;
		try {
			if ($deep.beforeUpdate) $deep.beforeUpdate.forEach((item: Function) => item());
		} catch (err) {
			if (error) {
				error.open(`Error beforeUpdate`, err.stack);
			}
		}
	}
	/**
	 * @updated
	 * for run before update data lifecycle
	 */
	updated() {
		const { error } = this;
		const { $deep } = this.component;
		try {
			if ($deep.updated) $deep.updated.forEach((item: Function) => item());
		} catch (err) {
			if (error) {
				error.open(`Error Updated`, err.stack);
			}
		}
	}
	/**
	 * @watch
	 * watch state/props/context
	 */
	watch(logic?: any, valueUpdate?: any) {
		this.component.$deep.watch.forEach((item) => {
			item.dependencies.forEach((dependencies) => {
				if (logic && logic(dependencies)) {
					return item.handle(dependencies, valueUpdate);
				}

				let current = "this.component." + dependencies;
				let value = eval(current);
				if (value) {
					item.handle(dependencies, value);
				}
			});
		});
	}
	/**
	 * @effect
	 * similar with watch, but effect is automatic without write dependencies
	 */
	effect(depend: string | boolean, value?: any) {
		(this.component.$deep.effect || []).forEach((item) => {
			if (typeof depend === "boolean") return item();

			let fn = item.toString();
			let checkIsTrue = fn.match(new RegExp(`this.${depend}|${depend}`, "g"));

			if (checkIsTrue) {
				let list = [];
				list.push(`this.${depend}=`);
				list.push(`this.${depend} =`);
				list.push(`this.${depend} +=`);
				list.push(`this.${depend} -=`);
				list.push(`this.${depend}+=`);
				list.push(`this.${depend}-=`);
				list.push(`${depend}=`);
				list.push(`${depend} =`);
				list.push(`${depend} +=`);
				list.push(`${depend} -=`);
				list.push(`${depend}+=`);
				list.push(`${depend}-=`);
				let notAllowed = new RegExp(list.join("|"), "g");
				let isIlegal = fn.match(notAllowed);
				if (!isIlegal) {
					item(value);
				}
				return;
			}
			return;
		});
	}
}
