// @ts-nocheck
export default function Page(app) {
	init(this, "auto");
	render(
		() => (
			<div>
				<h1 class="text-white">Test Page {app.params.id}</h1>
				<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Delectus dignissimos vel temporibus, laborum officia impedit maxime voluptas quos fugiat inventore nam unde, reiciendis quasi quia fuga maiores iste. Modi, ducimus.</p>
			</div>
		)
	);
};