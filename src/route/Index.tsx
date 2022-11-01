// @ts-nocheck
export default function Index() {
	init(this, "auto");
	state("", {
		click: 0,
	});
	const click = (e) => {
		this.state.click++
	}
	render(() => (
		<div className="index">
			<h1>Welcome to the Blaze Script!</h1>
			<p>
				This is still experimental maybe you found bug in this framework
			</p>
			<div className="action">
				<button class="primary" onClick={click}>{this.state.click} Clicked</button>
			</div>
			<div className="link">
				<a data-link href="/page">
					Route /page
				</a>
				<a data-link href="/page/1">
					Route /page/1
				</a>
			</div>
		</div>
	));
}
