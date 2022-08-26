// @ts-nocheck
import { init } from "@blaze";

export default function Index() {
	init(this, "auto");
	render(() => (
		<div>
			<p>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore
				magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
				consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
				pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
				laborum.
			</p>
			<a data-link href="/page">
				go /page
			</a>
			<a data-link href="/page/1">
				go /page/1
			</a>
		</div>
	));
}
