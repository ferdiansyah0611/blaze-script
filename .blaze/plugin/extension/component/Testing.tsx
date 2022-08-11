import { init } from "@blaze";

export default function Testing() {
	this.disableExtension = true;
	const { render } = init(this);
	render(() => (
		<div class="border-b border-gray-500 pl-4">
			<h5 class="flex-1 font-bold py-2">Test</h5>
			{this.props.describe.map((data) => (
				<div class="pb-2">
					<h6>{data.description}</h6>
					<div>
						{data.it.map((it) => (
							<div>
								<div class="flex items-center ml-4">
									<span class="rounded-full w-3 h-3 bg-white" style="margin-left: 5.5px;margin-right: 6.2px;"></span>
									<h6>{it.description}</h6>
								</div>
								{it.success.map((success) => (
									<div class="ml-4 text-green-400 flex">
										<span class="material-symbols-outlined">check</span>
										<p>{success}</p>
									</div>
								))}
								{it.error.map((error) => (
									<div class="ml-4 text-red-400 flex">
										<span class="material-symbols-outlined">close</span>
										<p>{error}</p>
									</div>
								))}
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	));
}
