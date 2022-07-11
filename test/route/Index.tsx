import { render, init, mount, batch, dispatch } from "@blaze";
// component
import Button from "../component/Button";
// store
import blog from "../store/blog";

const Index = function () {
	init(this);
	blog(this);
	const endpoint = "https://dev.to/api/";

	const pagination = (type) => {
		if (type === null) return true;
		else if (type) return dispatch('blog.nextPage', this);
		else if (!type) return dispatch('blog.prevPage', this);
	};
	const getNews = async (type) => {
		batch(async () => {
			pagination(type);
			let data = await fetch(endpoint + "articles?page=" + this.ctx.blog.page);
			data = await data.json();
			this.ctx.blog.data = data;
			window.scrollTo(0, 0)
			return Promise.resolve(true);
		}, this);
	};

	mount(() => {
		if(!this.ctx.blog.data.length) {
			getNews(null);
		}
	}, this);
	render(
		() => (
			<>
				<div refs="hi" className="p-4">
					<div id="blog" className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
						{this.ctx.blog.data.slice(0, 28).map((item, i) => (
							<div
								key={i}
								class="bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700"
							>
								<a href={"/blog/" + item.id} data-link>
									<img
										class="rounded-t-lg w-full"
										src={item.social_image}
										alt=""
									/>
								</a>
								<div class="p-5">
									<a href={"/blog/" + item.id} data-link>
										<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
											{item.title}
										</h5>
									</a>
									<p class="mb-3 font-normal text-gray-700 dark:text-gray-400">
										{item.description}
									</p>
									<a
										href={"/blog/" + item.id} data-link
										onClick={() => window.open(item.url)}
										class="inline-flex items-center py-2 px-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
									>
										Read more
										<svg
											class="ml-2 -mr-1 w-4 h-4"
											fill="currentColor"
											viewBox="0 0 20 20"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												fill-rule="evenodd"
												d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
												clip-rule="evenodd"
											></path>
										</svg>
									</a>
								</div>
							</div>
						))}
					</div>
					<div className="flex justify-center">
						<Button
							onClick={() => getNews(false)}
							color="primary"
							text="Previous"
							key={1000}
							style="margin-top: 15px;"
						/>
						<Button
							onClick={() => getNews(true)}
							color="primary"
							text="Next"
							key={1001}
							style="margin-top: 15px;"
						/>
					</div>
				</div>
			</>
		),
		this
	);
};

export default Index;