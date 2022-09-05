import { batch } from "@blaze";
import InputExtension from "./InputExtension";
import ListExtension from "./ListExtension";
import Testing from "./Testing";
import { App, Router } from "@root/system/global";

const exception = ["$name", "$children", "$root", "$index", "_isProxy", "fallback", 'h', 'Fragment', '_isContext'];

export default function Extension(keyApp) {
	// @ts-ignore
	const { render, state, mount, computed, created } = init(this);
	state("state", {
		console: [],
		log: [],
		component: [],

		searchComponent: "",

		open: false,
		openConsole: false,
		openLog: false,
		openComponent: false,

		runTest: {},

		selectComponent: {
			$deep: {},
		},
		resultTest: {
			result: []
		}
	});
	created(() => {
		let value = localStorage.getItem('extension')
		if(value && value === "1") {
			this.state.open = true;
		} else {
			this.state.open = false;
		}
	})
	mount(() => {
		// inject to window
		window.$extension = this;
		let router = Router.get(keyApp);
		if (router)
			router.watch(() => {
				batch(() => {
					this.clearLog();
					this.state.selectComponent = {
						$deep: {},
					};
					this.state.component = this.state.component.filter((item) => item.$node.isConnected);
				}, this);
			});
	});
	computedExtension(computed, keyApp);

	render(() => {
		return (
			<div id="extension" class={this.state.open ? "open" : "close"}>
				<div class={this.state.open ? "block" : "hidden"}>
					{/*console*/}
					{this.state.openConsole && (
						<div>
							<div class="flex text-white">
								<h5 class="p-2 flex-1 font-bold">Console</h5>
								<button onClick={() => (this.state.console = [])} class="bg-gray-800 p-2">
									Clear
								</button>
								<button onClick={this.runConsole} class="bg-blue-800 p-2">
									Run
								</button>
							</div>
							<div>
								<div style={"max-height: 50vh;overflow: auto;"}>
									<div class="text-sm mb-2 p-2">
										{this.state.console.map((item) => (
											<div diff class="border-b flex">
												<p className="text-gray-100 flex-1">
													{typeof item.data === "string" ? item.data : JSON.stringify(item.data)}
												</p>
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
								<button onClick={this.clearLog} class="bg-gray-800 p-2">
									Clear
								</button>
							</div>
							<div className="text-sm mb-2 p-2" id="list-log" style={"max-height: 30vh;overflow: auto;"}>
								{this.state.log
									.sort((a, b) => b.at - a.at)
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
								<div refs="bodyComponent" style={"max-height: 50vh;overflow: auto;flex: 1;"}>
									<div class="sticky top-0 z-10 bg-black">
										<input
											onChangeValue={this.handleSearchComponent}
											placeholder="Search component..."
											class="bg-black text-sm w-full text-white p-2 focus:border-gray-600 flex-1 focus:outline-none"
											type="text"
											style="margin: 6px;"
										/>
									</div>
									<div id="list-component" class="flex flex-col text-white p-2">
										{(this.state.searchComponent
											? this.state.component.filter(
													(item) => item.constructor.name.indexOf(this.state.searchComponent) !== -1
											  )
											: this.state.component
										).map((item, i) => (
											<ListExtension current={0} key={i + 1} setSelectComponent={this.setSelectComponent} item={item} />
										))}
									</div>
								</div>
								<div diff class="text-white flex-1" style={"max-height: 50vh;overflow: auto;max-width: 450px;"}>
									<div>
										{this.state.selectComponent.constructor.name !== "Object" ? (
											<div diff class="flex space-x-2 items-center p-2">
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
										{this.props.length ? (
											<div>
												<h6 class="ml-2 font-medium p-2">Props</h6>
												<div class="flex flex-col border-b border-gray-500 pb-2">
													{this.props.map((item, i) => (
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
										{this.selectComponentState.length ? (
											<div>
												<h6 class="ml-2 font-medium p-2">State</h6>
												<div class="flex flex-col border-b border-gray-500 pb-2">
													{this.selectComponentState.map((item) => (
														<div>
															{!['$node', '$router', '$config'].includes(item) &&
																Object.keys(this.state.selectComponent[item] || {})
																	.filter((item) => exception.includes(item) === false)
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
										{this.selectComponentContext.length ? (
											<div>
												<div class="flex flex-col border-b border-gray-500 pb-2">
													{this.selectComponentContext.map((item) => (
														<div>
															<h5 class="text-gray-200 p-2 ml-2">
																{item} - Context
															</h5>
															{Object.keys(this.state.selectComponent["ctx"][item] || {})
																.filter((items) => items !== "_isContext" && items !== '_isProxy')
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

										{
											(window.$test && this.state.runTest && this.state.resultTest.result.length) ?
											<Testing
												describe={this.state.resultTest.result}
											/>
											: false
										}
										<div diff className="mt-2">
											{this.state.selectComponent.$node ? (
												<div>
													<div diff class="ml-2">
														<h5 diff class="p-2 flex-1 font-bold">
															More
														</h5>
													</div>
													<div diff class="p-2 flex space-x-1 ml-2">
														{
															window.$test ?
															<button onClick={this.runTest} class="bg-green-800 p-2 text-sm" d>
																Run Test
															</button>
															: false
														}
														<button
															onClick={() => this.state.selectComponent.$deep.trigger()}
															class="bg-gray-800 p-2 text-sm"
															d
														>
															Trigger
														</button>
														<button
															onClick={() => this.state.selectComponent.$deep.remove()}
															class="bg-gray-800 p-2 text-sm"
															d
														>
															Remove
														</button>
													</div>
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
						<div diff className="flex space-x-2 text-white text-sm p-2">
							<a className="bg-gray-800 p-2" onClickPrevent={this.handleConsole} href="/">
								Console
							</a>
							<a className="bg-gray-800 p-2" onClickPrevent={this.handleComponent} href="/">
								Component
							</a>
							<a className="bg-gray-800 p-2" onClickPrevent={this.handleLog} href="/">
								Log
							</a>
							<div class="flex-1 flex justify-end items-center">
								<a href="/" onClickPrevent={this.toggleOpen}>
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
						<a href="/" class="text-white" onClickPrevent={this.toggleOpen}>
							<span class="material-symbols-outlined p-2">construction</span>
						</a>
					) : (
						false
					)}
				</div>
			</div>
		);
	});
}

const computedExtension = (computed, keyApp) => {
	computed(function () {
		return {
			method: {
				// prototype
				addLog: (data, trigger) => {
					this.state.log.push(data);
					if (trigger) this.$deep.trigger();
				},
				addComponent: (data, trigger) => {
					this.state.component.push(data);
					if (trigger) this.$deep.trigger();
				},
				reload: () => {
					batch(() => {
						this.clearLog();
						this.state.selectComponent = null;
						this.state.component = [];
						this.state.runTest = false;
					}, this);
				},
				// more
				toggleOpen: () => {
					batch(() => {
						this.state.openConsole = false;
						this.state.openLog = false;
						this.state.openComponent = false;
						this.state.open = !this.state.open;
						localStorage.setItem('extension', this.state.open ? "1" : "0")
						this.resizeBody(this.state.open);
					}, this)

				},
				resizeBody: (isTrue) => {
					setTimeout(() => {
						let node = App.get(keyApp, 'app')
						if (node.$node) {
							node.$node.style.marginBottom = `${!isTrue ? 0 : this.$node.offsetHeight}px`;
						}
					}, 1000);
				},
				handleConsole: () => {
					batch(() => {
						this.state.openLog = false;
						this.state.openComponent = false;
						this.state.openConsole = !this.state.openConsole;
					}, this);
					this.resizeBody();
				},
				handleLog: () => {
					batch(() => {
						this.state.openComponent = false;
						this.state.openConsole = false;
						this.state.openLog = !this.state.openLog;
					}, this);
					this.resizeBody();
				},
				handleComponent: () => {
					batch(() => {
						this.state.openConsole = false;
						this.state.openLog = false;
						this.state.openComponent = !this.state.openComponent;
					}, this);
					this.resizeBody();
				},
				runConsole: () => {
					try {
						this.state.console.push({
							data: Function(`return arguments[0].$node.querySelector("#console").value`)(this),
							at: new Date(),
						});
						this.$deep.trigger();
					} catch (err) {}
				},
				runTest: () => {
					batch(() => {
						this.state.runTest = true;
						if (window.$test) {
							let check = window.$test.find((test) => test.name === this.state.selectComponent.$node.$name);
							if (check) {
								check.callback(this.state.selectComponent);
								this.state.resultTest = this.state.selectComponent.$deep.test
							}
						}
					}, this)
				},
				clearLog: () => {
					this.state.log = [];
					console.clear();
				},
				setSelectComponent: (data) => batch(() => {
					this.state.runTest = false;
					this.state.selectComponent = data
				}, this),
				handleSearchComponent: (value) => {
					let list = Array.from(this.$node.querySelectorAll('[data-n="ListExtension"]'));
					list.forEach((node: HTMLElement) => {
						let current: any = node.children[0];
						if (
							node.children.length &&
							value &&
							(current.dataset.search.match(value) || current.dataset.i.match(value))
						) {
							current.classList.add("bg-green-800");
						} else if (current) {
							current.classList.remove("bg-green-800");
						}
					});
				},
			},
			get: {
				selectComponentState: () => {
					return Object.keys(this.state.selectComponent || {}).filter(
						(item) => this.state.selectComponent[item]?._isProxy === true && item !== "props" && item !== "$deep"
					)
				},
				selectComponentContext: () => Object.keys(this.state.selectComponent.ctx || {}).filter(item => item !== '_isProxy'),
				props: () =>
					Object.keys(this.state.selectComponent.props || {}).filter((item) => exception.includes(item) === false),
			},
		};
	});
};
