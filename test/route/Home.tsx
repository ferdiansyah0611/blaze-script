import { render, init } from "@blaze";

const Home = function () {
	init(this);
	render(
		() => (
			<>
				<div className="p-4">
					<p>Home</p>
				</div>
			</>
		),
		this
	);
};

export default Home;
