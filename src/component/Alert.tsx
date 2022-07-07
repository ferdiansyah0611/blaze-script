import { render, state, watch, init } from "@blaze";

const Alert = function () {
	init(this);
	state(
		"state",
		{
			class: "",
		},
		this
	);
	let data = {
		info: "p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-200 dark:text-blue-800",
		error: "p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800",
		success:
			"p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800",
		warning:
			"p-4 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg dark:bg-yellow-200 dark:text-yellow-800",
		dark: "p-4 text-sm text-gray-700 bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-gray-300",
	};
	watch(
		["props.type"],
		(...arg: any[]) => {
			this.state.class = data[arg[1]];
		},
		this
	);
	render(
		() => (
			<>
				<div
					className={this.state.class}
					role="alert"
				>
					<span className="font-medium">{this.props.title}</span>{" "}
					{this.props.message}
				</div>
			</>
		),
		this
	);
};

export default Alert;
