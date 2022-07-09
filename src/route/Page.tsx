import { render, init } from "@blaze";

export default function Page(app) {
	init(this);
	render(
		() => (
			<>
				<p>Test Page {app.params.id}</p>
			</>
		),
		this
	);
};