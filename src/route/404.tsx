// @ts-nocheck
import { init } from "@blaze";

export default function NotFound() {
	init(this, "auto");
	render(
		() => (
			<p>404</p>
		)
	);
};