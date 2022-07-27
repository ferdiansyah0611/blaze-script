import { render, init } from "@blaze";
import "@style/index.css";
// component
import Counter from "@component/Counter";

export default function Index() {
	init(this);
	render(
		() => (
			<div d class="index">
				<div d class="bg-gray-900 p-2 rounded-md border border-gray-500 text-white">
					<h2 d>Blaze Script</h2>
					<p d>Virtual DOM For Single Page Application using Vite & Typescript.</p>
					<div d class="mt-2">
						<Counter/>
					</div>
				</div>
			</div>
		),
		this
	);
};