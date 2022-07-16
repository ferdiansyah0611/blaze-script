import { render, init } from "@blaze";

const About = function () {
	init(this);
	render(
		() => (
			<>
				<div className="p-4 text-white min-h-screen">
					<p>About</p>
				</div>
			</>
		),
		this
	);
};

export default About;
