// @ts-nocheck
import { startIn } from "@root/plugin/router";

export default function MyApp() {
	init(this, "auto");
	startIn(this);

	render(
		() => (
			<div className="p-4">
				<div id="route"></div>
			</div>
		)
	);
}
