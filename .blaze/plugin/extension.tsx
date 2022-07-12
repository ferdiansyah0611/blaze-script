import { render, state, init, mount } from "@blaze";
import { mountUtilities } from "@root/core";

type Log = {
	msg: string;
	at?: Date;
};

export const addLog = (data: Log, trigger = true) => {
	if (window.$extension) {
		window.$extension.addLog(
			{
				msg: data.msg,
				at: new Date(),
			},
			trigger
		);
	}
};
export const addComponent = (data, trigger = true) => {
	if (window.$extension) {
		window.$extension.addComponent(data, trigger);
	}
};

export const withExtension = (entry: string, enabled: boolean) => {
	return () => {
		let query = document.querySelector(entry);
		if (query && enabled) {
			let component = new Extension();
			component.$node = component.render();
			mountUtilities(component.$deep, {}, true);
			query.append(component.$node);
		}
	};
};

function Extension() {
	init(this);
	state(
		"state",
		{
			log: [],
			component: [],

			openLog: false,
			openComponent: true,

			selectComponent: {},
		},
		this
	);
	mount(() => {
		window.$extension = this;
		this.$node.className = "fixed bottom-0 z-10 bg-gray-900 w-full";
		this.addLog = (data: Log, trigger) => {
			this.state.log.push(data);
			if (trigger) this.$deep.trigger();
		};
		this.addComponent = (data, trigger) => {
			this.state.component.push(data);
			if (trigger) this.$deep.trigger();
		};
		// inject to window
		// clear on url change
		window.addEventListener("popstate", () => {
			this.state.component = [];
		});
	}, this);
	// action
	const handleLog = () => (this.state.openLog = !this.state.openLog);
	const handleComponent = () => (this.state.openComponent = !this.state.openComponent);
	const clearLog = () => (this.state.log = []);
	const setSelectComponent = (data) => (this.state.selectComponent = data);
	// render
	render(() => {
		let { selectComponent } = this.state;
		let props = Object.keys(selectComponent.props || {}).filter((item) => item !== "_isProxy");
		let selectComponentState = Object.keys(selectComponent || {}).filter(
			(item) => selectComponent[item]._isProxy === true && item !== "props"
		);
		let selectComponentContext = Object.keys(selectComponent.ctx || {});
		return (
			<>
				<div>
					{this.state.openLog && (
						<div>
							<div class="flex text-white">
								<h5 class="p-2 flex-1">Logger</h5>
								<button onClick={clearLog} class="bg-gray-800 p-2">
									Clear
								</button>
							</div>
							<div className="text-sm mb-2 p-2" id="list-log" style={"max-height: 30vh;overflow: auto;"}>
								{this.state.log
									.reverse()
									.slice(0, 50)
									.map((item) => (
										<div className="border-b border-gray-400 flex">
											<p className="text-gray-100 flex-1">{item.msg}</p>
											<p className="text-gray-100">{item.at.toLocaleString()}</p>
										</div>
									))}
							</div>
						</div>
					)}
					{this.state.openComponent && (
						<div>
							<div class="flex text-white">
								<h5 class="p-2 flex-1">Component</h5>
							</div>
							<div class="flex">
								<div style={"max-height: 50vh;overflow: auto;"}>
									<div id="list-component" class="flex flex-col text-white p-2">
										{this.state.component.map((item, i) => (
											<ComponentList
												current={0}
												key={i + 1}
												setSelectComponent={setSelectComponent}
												item={item}
											/>
										))}
									</div>
								</div>
								<div class="text-white p-2 flex-1" style={"max-height: 50vh;overflow: auto;"}>
									<div>
										<h5 class="font-bold">{selectComponent.constructor.name}</h5>
										{props.length ? (
											<div>
												<h6>Props</h6>
												<div class="flex flex-col">
													{props.map((item) => (
														<div class="flex space-x-2 items-center mt-1 text-sm">
															<p class="p-2 flex-1">{item}</p>
															<input
																disabled={
																	typeof selectComponent.props[item] === "function" ||
																	item === "key"
																}
																class="bg-black text-white p-2 focus:border-gray-600"
																value={selectComponent.props[item]}
																onChangeValue={(val) =>
																	(selectComponent.props[item] = val)
																}
																type="text"
															/>
															<p class="p-2 italic flex-1 text-green-400">
																{typeof selectComponent.props[item]}
															</p>
														</div>
													))}
												</div>
											</div>
										) : (
											false
										)}
										{selectComponentState.length ? (
											<div>
												<h6>State</h6>
												<div class="flex flex-col">
													{selectComponentState.map((item) => (
														<div>
															{Object.keys(selectComponent[item] || {})
																.filter((items) => items !== "_isProxy")
																.map((state, i) => (
																	<InputHandling
																		name={state}
																		value={selectComponent[item][state]}
																		disableMargin={true}
																		key={i + 1}
																	/>
																))}
														</div>
													))}
												</div>
											</div>
										) : (
											false
										)}
										{selectComponentContext.length ? (
											<div>
												<h6>Context</h6>
												<div class="flex flex-col">
													{selectComponentContext.map((item, key) => (
														<div>
															<h5 class="text-gray-200">{key + 1}. {item}</h5>
															{Object.keys(selectComponent["ctx"][item] || {})
																.filter((items) => items !== "_isContext")
																.map((state, i) => (
																	<InputHandling
																		name={state}
																		value={selectComponent["ctx"][item][state]}
																		key={i + 1}
																	/>
																))}
														</div>
													))}
												</div>
											</div>
										) : (
											false
										)}
										<div className="mt-2">
											<button
												onClick={() => selectComponent.$deep.trigger()}
												class="bg-gray-800 p-2 text-sm"
											>
												Trigger
											</button>
											<button
												onClick={() => selectComponent.$deep.remove()}
												class="bg-gray-800 p-2 text-sm"
											>
												Remove
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
				<div d className="flex space-x-2 text-white text-sm p-2">
					<a className="bg-gray-800 p-2" href="/">
						Console
					</a>
					<a className="bg-gray-800 p-2" onClickPrevent={handleComponent} href="/">
						Component
					</a>
					<a className="bg-gray-800 p-2" onClickPrevent={handleLog} href="/">
						{!this.state.openLog ? "Open Log" : "Close Log"}
					</a>
				</div>
			</>
		);
	}, this);
}

function ComponentList() {
	init(this);
	render(() => {
		return (
			<>
				<div style={this.props.style || ""} class="flex-1">
					<button
						onClick={() => this.props.setSelectComponent(this.props.item)}
						class="bg-gray-800 p-2 w-full rounded-md mb-1"
					>
						{this.props.item.constructor.name}
					</button>
					{this.props.item.$deep.registry.map((item, i) => (
						<ComponentList
							current={this.props.current + 1}
							style={`margin-left: ${(this.props.current + 1) * 10}px;`}
							key={i + 1}
							setSelectComponent={this.props.setSelectComponent}
							item={item.component}
						/>
					))}
				</div>
			</>
		);
	}, this);
}

function InputHandling() {
	init(this);
	render(() => {
		let { name, value, disableMargin } = this.props;
		return (
			<>
				<div class={"flex space-x-2 items-center mt-1 text-sm" + (disableMargin ? '': ' ml-2')}>
					<p class="p-2 flex-1">{name}</p>
					{Array.isArray(value) || typeof value === "object" ? (
						<textarea
							class="bg-black text-white p-2 focus:border-gray-600 flex-1 w-full"
							onChangeValue={(val) => (value = JSON.parse(val))}
							rows="10"
						>
							{JSON.stringify(value)}
						</textarea>
					) : (
						<input
							class="bg-black text-white p-2 focus:border-gray-600"
							value={value}
							onChangeValue={(val) => val}
							type="text"
						/>
					)}
					<p class="p-2 italic flex-1 text-green-400">
						{Array.isArray(value) ? `Array[${value.length}]` : typeof value}
					</p>
				</div>
			</>
		);
	}, this);
}
