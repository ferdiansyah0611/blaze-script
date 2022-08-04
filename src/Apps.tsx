import { init } from "@blaze";
import { startIn } from "@root/plugin/router";

export default function MyApp() {
	const { render } = init(this);
	startIn(this);

	render(
		() => (
			<div className="p-4">
				<div id="route"></div>
			</div>
		)
	);
}
