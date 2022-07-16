import { render, init, mount, batch, state } from "@blaze";
import helmet from '@root/plugin/helmet'

const Show = function (app) {
	init(this);
	state(
		"state",
		{
			data: {
				user: {}
			},
		},
		this
	);
	mount(() => {
		let fetching = async () => {
			let data = await fetch(
				"https://dev.to/api/articles/" + app.params.id
			);
			this.state.data = await data.json();
			helmet({
				title: this.state.data.title,
				description: this.state.data.description,
			})
		};
		fetching();
	}, this);

	render(() => {
		let data = this.state.data;
		return (
			<>
				<div className="p-2 md:p-5 lg:p-20">
					<div className="">
					{data.title ?
						<div d>
							<h5 class="font-bold text-xl text-white text-center mb-2">{data.title}</h5>
							<section class="p-2 border border-gray-700 text-white dark:bg-gray-800" setHTML={data.body_html}></section>
						</div>
						: false
					}
					</div>
					<div className="flex justify-center my-5">
						<div className="max-w-sm bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700 p-4">
							<div className="flex flex-col items-center pb-10">
								<img
									className="mb-3 w-24 h-24 rounded-full shadow-lg"
									src={data.user.profile_image}
									alt={data.user.name}
								/>
								<h5 className="mb-1 text-xl font-medium text-gray-900 dark:text-white">
									{data.user.name}
								</h5>
								<div className="flex mt-4 space-x-3 lg:mt-6">
									{
										data.user.twitter_username ?
										<a
											href={'https://twitter.com/' + data.user.twitter_username}
											className="inline-flex items-center py-2 px-4 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
										>
											Twitter
										</a>
										: false
									}
									<a
										href=""
										className="inline-flex items-center py-2 px-4 text-sm font-medium text-center text-gray-900 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700"
									>
										Message
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</>
		);
	}, this);
};

export default Show;
