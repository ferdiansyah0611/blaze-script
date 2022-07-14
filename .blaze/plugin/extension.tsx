import { render, state, init, mount, batch } from "@blaze";
import { mountCall } from "@root/core";

type Log = {
	msg: string;
	at?: Date;
	type?: "success" | "warn" | "error";
};

export const addLog = (data: Log, trigger = true) => {
	if (window.$extension) {
		window.$extension.addLog(
			{
				msg: data.msg,
				type: data.type,
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
			mountCall(component.$deep, {}, true);
			query.append(component.$node);
		}
	};
};

function Extension() {
	init(this);
	state(
		"state",
		{
			console: [],
			log: [],
			component: [],

			searchComponent: "",

			open: false,
			openConsole: false,
			openLog: false,
			openComponent: false,

			selectComponent: {
				$deep: {},
			},
		},
		this
	);
	mount(() => {
		// inject to window
		window.$extension = this;
		if (window.$app.$router)
			window.$app.$router.onChange(() => {
				batch(() => {
					clearLog();
					this.state.selectComponent = {
						$deep: {},
					};
					this.state.component = this.state.component.filter((item) => item.$node.isConnected);
				}, this);
			});
		// more
		toggleOpen();
		// prototype
		this.addLog = (data: Log, trigger) => {
			this.state.log.push(data);
			if (trigger) this.$deep.trigger();
		};
		this.addComponent = (data, trigger) => {
			this.state.component.push(data);
			if (trigger) this.$deep.trigger();
		};
	}, this);
	// action
	const toggleOpen = () => {
		let openClass = "fixed bottom-0 z-10 bg-gray-900 w-full";
		let closeClass = "fixed bottom-0 right-0 z-10 bg-gray-900";
		// on open
		if (!this.state.open) {
			this.$node.className = openClass;
		}
		// on close
		else {
			this.$node.className = closeClass;
		}
		this.state.open = !this.state.open;
	};
	const resizeBody = () => {
		setTimeout(() => {
			window.$app.$node.style.marginBottom = `${this.$node.offsetHeight}px`;
		}, 1000);
	};
	const handleConsole = () => {
		batch(() => {
			this.state.openLog = false;
			this.state.openComponent = false;
			this.state.openConsole = !this.state.openConsole;
		}, this);
		resizeBody();
	};
	const handleLog = () => {
		batch(() => {
			this.state.openComponent = false;
			this.state.openConsole = false;
			this.state.openLog = !this.state.openLog;
		}, this);
		resizeBody();
	};
	const handleComponent = () => {
		batch(() => {
			this.state.openConsole = false;
			this.state.openLog = false;
			this.state.openComponent = !this.state.openComponent;
		}, this);
		resizeBody();
	};
	const clearLog = () => (this.state.log = []);
	const setSelectComponent = (data) => (this.state.selectComponent = data);

	// render
	const selectComponentState = () =>
		Object.keys(this.state.selectComponent || {}).filter(
			(item) => this.state.selectComponent[item]._isProxy === true && item !== "props"
		);
	const selectComponentContext = () => Object.keys(this.state.selectComponent.ctx || {});
	const props = () => Object.keys(this.state.selectComponent.props || {}).filter((item) => item !== "_isProxy");

	render(() => {
		return (
			<>
				<div class={this.state.open ? "block" : "hidden"}>
					{/*console*/}
					{this.state.openConsole && (
						<div>
							<div class="flex text-white">
								<h5 class="p-2 flex-1 font-bold">Console</h5>
								<button onClick={() => (this.state.console = [])} class="bg-gray-800 p-2">
									Clear
								</button>
								<button
									onClick={() => {
										this.state.console.push({
											data: eval(this.$node.querySelector("#console").value),
											at: new Date(),
										});
										this.$deep.trigger();
									}}
									class="bg-blue-800 p-2"
								>
									Run
								</button>
							</div>
							<div>
								<div style={"max-height: 50vh;overflow: auto;"}>
									<div class="text-sm mb-2 p-2">
										{this.state.console.map((item) => (
											<div d class="border-b flex">
												<p className="text-gray-100 flex-1">{item.data}</p>
												<p className="text-gray-100">{item.at.toLocaleString()}</p>
											</div>
										))}
									</div>
								</div>
							</div>
							<div>
								<textarea
									placeholder="Write code!"
									class="bg-black text-white p-2 focus:border-gray-600 w-full focus:outline-none"
									rows="2"
									id="console"
								></textarea>
							</div>
						</div>
					)}
					{/*log*/}
					{this.state.openLog && (
						<div>
							<div class="flex text-white">
								<h5 class="p-2 flex-1 font-bold">Logger</h5>
								<button onClick={clearLog} class="bg-gray-800 p-2">
									Clear
								</button>
							</div>
							<div className="text-sm mb-2 p-2" id="list-log" style={"max-height: 30vh;overflow: auto;"}>
								{this.state.log
									.reverse()
									.slice(0, 50)
									.map((item) => (
										<div className="border-b flex">
											{item.type === "warn" && <p className="text-yellow-100 flex-1">{item.msg}</p>}
											{item.type === "error" && <p className="text-red-100 flex-1">{item.msg}</p>}
											{item.type === "success" && <p className="text-green-100 flex-1">{item.msg}</p>}
											{!item.type && <p className="text-gray-100 flex-1">{item.msg}</p>}
											<p className="text-gray-100">{item.at.toLocaleString()}</p>
										</div>
									))}
							</div>
						</div>
					)}
					{/*component*/}
					{this.state.openComponent && (
						<div>
							<div class="flex text-white">
								<h5 class="p-2 flex-1 font-bold">Component</h5>
							</div>
							<div class="flex">
								<div style={"max-height: 50vh;overflow: auto;max-width: 300px;flex: 1;"}>
									<div class="sticky top-0 z-10">
										<input
											value={this.state.searchComponent}
											onKeyUpValue={(value) => (this.state.searchComponent = value)}
											placeholder="Search component..."
											class="bg-black text-sm w-full text-white p-2 focus:border-gray-600 flex-1 focus:outline-none"
											type="text"
										/>
									</div>
									<div id="list-component" class="flex flex-col text-white p-2">
										{(this.state.searchComponent
											? this.state.component.filter(
													(item) => item.constructor.name.indexOf(this.state.searchComponent) !== -1
											  )
											: this.state.component
										).map((item, i) => (
											<ListExtension current={0} key={i + 1} setSelectComponent={setSelectComponent} item={item} />
										))}
									</div>
								</div>
								<div d class="text-white p-2 flex-1" style={"max-height: 50vh;overflow: auto;"}>
									<div>
										{this.state.selectComponent.constructor.name !== "Object" ? (
											<div d class="flex space-x-2 items-center">
												<span
													class={
														this.state.selectComponent.$node.isConnected
															? "w-4 h-4 rounded-full bg-green-500"
															: "w-4 h-4 rounded-full bg-red-500"
													}
												></span>
												<h5 class="font-bold">{this.state.selectComponent.constructor.name}</h5>
												<p class="text-gray-300">{this.state.selectComponent.$deep.time + "ms"}</p>
											</div>
										) : (
											false
										)}
										{props().length ? (
											<div>
												<h6>Props</h6>
												<div class="flex flex-col">
													{props().map((item, i) => (
														<InputExtension
															name={item}
															value={this.state.selectComponent.props[item]}
															disableMargin={true}
															onChange={(val) => (this.state.selectComponent.props[item] = val)}
															key={i + 2000}
														/>
													))}
												</div>
											</div>
										) : (
											false
										)}
										{selectComponentState().length ? (
											<div>
												<h6>State</h6>
												<div class="flex flex-col">
													{selectComponentState().map((item) => (
														<div>
															{Object.keys(this.state.selectComponent[item] || {})
																.filter((items) => items !== "_isProxy")
																.map((state, i) => (
																	<InputExtension
																		name={state}
																		value={this.state.selectComponent[item][state]}
																		disableMargin={true}
																		onChange={(val) => (this.state.selectComponent[item][state] = val)}
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
										{selectComponentContext().length ? (
											<div>
												<h6>Context</h6>
												<div class="flex flex-col">
													{selectComponentContext().map((item, key) => (
														<div>
															<h5 class="text-gray-200">
																{key + 1}. {item}
															</h5>
															{Object.keys(this.state.selectComponent["ctx"][item] || {})
																.filter((items) => items !== "_isContext")
																.map((state, i) => (
																	<InputExtension
																		name={state}
																		value={this.state.selectComponent["ctx"][item][state]}
																		disableMargin={true}
																		onChange={(val) => (this.state.selectComponent["ctx"][item][state] = val)}
																		key={i + 1000}
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
											{this.state.selectComponent.constructor.name !== "Object" ? (
												<div>
													<button
														onClick={() => this.state.selectComponent.$deep.trigger()}
														class="bg-gray-800 p-2 text-sm"
													>
														Trigger
													</button>
													<button
														onClick={() => this.state.selectComponent.$deep.remove()}
														class="bg-gray-800 p-2 text-sm"
													>
														Remove
													</button>
												</div>
											) : (
												false
											)}
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
				<div>
					{this.state.open ? (
						<div d className="flex space-x-2 text-white text-sm p-2">
							<a className="bg-gray-800 p-2" onClickPrevent={handleConsole} href="/">
								Console
							</a>
							<a className="bg-gray-800 p-2" onClickPrevent={handleComponent} href="/">
								Component
							</a>
							<a className="bg-gray-800 p-2" onClickPrevent={handleLog} href="/">
								{!this.state.openLog ? "Open Log" : "Close Log"}
							</a>
							<div class="flex-1 flex justify-end items-center">
								<a href="/" onClickPrevent={toggleOpen}>
									<span class="material-symbols-outlined">close</span>
								</a>
							</div>
						</div>
					) : (
						false
					)}
				</div>
				<div>
					{!this.state.open ? (
						<a href="/" class="text-white" onClickPrevent={toggleOpen}>
							<span class="material-symbols-outlined p-2">construction</span>
						</a>
					) : (
						false
					)}
				</div>
			</>
		);
	}, this);
}

function ListExtension() {
	init(this);
	render(() => {
		return (
			<>
				<div style={this.props.style || ""} class="flex-1">
					<button
						onClick={() => this.props.setSelectComponent(this.props.item)}
						class="bg-gray-800 p-2 w-full rounded-md mb-1 text-sm"
					>
						{this.props.item.constructor.name}
					</button>
					{this.props.item.$deep.registry.map((item, i) => (
						<ListExtension
							current={this.props.current + 1}
							style={`margin-left: ${(this.props.current + 1) * 20}px;`}
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

function InputExtension() {
	init(this);
	render(() => {
		let { name, value, disableMargin, onChange } = this.props;
		return (
			<>
				<div class={"flex space-x-2 items-center mt-1 text-sm" + (disableMargin ? "" : " ml-2")}>
					<p class="p-2 flex-1">{name}</p>
					{(Array.isArray(value) || typeof value === "object") && !(typeof value === "function") ? (
						<textarea
							class="bg-black text-white p-2 focus:border-gray-600 flex-1"
							onChangeValue={(val) => (onChange ? onChange(JSON.parse(val)) : (value = JSON.parse(val)))}
							rows="5"
							disabled={name === "key"}
						>
							{JSON.stringify(value)}
						</textarea>
					) : (
						<input
							class="bg-black text-white p-2 focus:border-gray-600 flex-1"
							value={value}
							onChangeValue={(val) => (onChange ? onChange(val) : (value = val))}
							type={typeof value === "number" ? "number" : "text"}
							disabled={name === "key" || typeof value === "function"}
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
