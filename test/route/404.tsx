import { render, init } from "@blaze";

const NotFound = function () {
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

export default NotFound;
