const local = (name: string, component) => {
	let value = localStorage.getItem(name);
	if (value) {
		value = JSON.parse(value);
	}
	if (!component.local) {
		component.local = {};
	}
	component.local[name] = value;
	return (data: any) => {
		let commit
		if(typeof data === 'function') {
			commit = data(component.local[name])
		} else {
			commit = data
		}
		localStorage.setItem(name, JSON.stringify(commit));
		component.local[name] = commit;
		component.$deep.trigger();
	};
};

export default local;
