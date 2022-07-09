import { render, init } from "@blaze";

export default function NotFound() {
	init(this);
	render(
		() => (
			<>
				<p>404</p>
			</>
		),
		this
	);
};