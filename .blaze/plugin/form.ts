declare global{
	interface Array<T>{
		add(param: any)
	}
}

export default function form(nameFunction: string, handle: (err) => any, validate: any, onSuccess: () => any, component) {
	component[nameFunction] = () => {
		Object.keys(validate).forEach((name) => {
			let node = component.$node.querySelector(`[name="${name}"]`);
			let validation = validate[name];
			let list = [];

			if (node) {
				let value = node.value;
				let check = (property) => validation.hasOwnProperty(property);
				let customize = check("message") ? validation.message : null;

				Array.prototype.add = function (param) {
					let commit;
					if (customize) commit = customize;
					else if (Array.isArray(param)) commit = param.join(" ");
					else commit = param;
					this.push(commit);
				};

				if (check("min")) {
					if (value.length < validation.min) {
						list.add([name, "length less than", validation.min]);
					}
				}
				if (check("max")) {
					if (value.length > validation.max) {
						list.add([name, "length more than", validation.max]);
					}
				}
				if (check("required")) {
					if (validation.required && !value.length) {
						list.add([name, "is required"]);
					}
				}
				if (check("pattern")) {
					if (!value.match(validation.pattern)) {
						list.add([name, "is not pattern"]);
					}
				}
				if (check("list")) {
					if (!validation.list.includes(value)) {
						list.add([name, "value is not at list.", "list of value is", validation.list.join(", ")]);
					}
				}
				if (check("isEmail")) {
					if (!value.match(/^\S+@\S+\.\S+$/)) {
						list.add([name, "is not valid email"]);
					}
				}
				if (check("isInt")) {
					if (!Number.isInteger(parseInt(value))) {
						list.add([name, "is not valid integer"]);
					}
				}
				if (check("isFloat")) {
					if (!parseFloat(value)) {
						list.add([name, "is not valid float"]);
					}
				}
				if (check("isDate")) {
					let date = new Date(value).toString()
					if(date === 'Invalid Date') {
						list.add([name, "is not valid date"]);
					}
				}

				handle(list);

				if (!list.length) {
					onSuccess();
				}
			}
		});
	};
}
