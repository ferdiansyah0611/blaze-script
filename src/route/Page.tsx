// @ts-nocheck
export default function Page(app) {
	init(this, "auto");
	render(
		() => (
			<p class="text-white">Test Page {app.params.id}</p>
		)
	);
};