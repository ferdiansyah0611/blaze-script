import App, { render, state, init, mount, batch, context, dispatch } from "@blaze";
import { makeRouter, page } from "@blaze.router";
import Button from "./component/Button";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";

const movies = context("movies", {
    data: [],
    page: 1
}, {
	nextPage(state){
		this.ctx.movies.page++
	},
	prevPage(state){
		this.ctx.movies.page--
	},
});

const TestApp = function () {
	init(this);

	render(
		() => (
			<>
				<div d>
					<Navbar />
					<div d id="route"></div>
					<Footer />
				</div>
			</>
		),
		this
	);
};
const Index = function () {
	init(this);
	movies(this);
	const endpoint = "https://www.omdbapi.com/?apikey=c8a4a454&s=marvel";
	state(
		"blog",
		{
			data: [],
			page: 1,
		},
		this
	);

	const pagination = (type) => {
		if (type === null) return true;
		else if (type) return dispatch('movies.nextPage', this);
		else if (!type) return dispatch('movies.prevPage', this);
	};
	const getNews = async (type) => {
		batch(async () => {
			pagination(type);
			let commit = [];
			let data = await fetch(endpoint + "&page=" + this.ctx.movies.page);
			data = await data.json();
			commit = data.Search;
			this.ctx.movies.data = commit ? commit : [];
			window.scrollTo(0, 0)
			return Promise.resolve(true);
		}, this);
	};

	mount(() => {
		if(!this.ctx.movies.data.length) {
			getNews(null);
		}
	}, this);
	render(
		() => (
			<>
				<div refs="hi" className="p-4">
					<div className="grid gap-2 grid-cols-2 md:grid-cols-4">
						{this.ctx.movies.data.map((item, i) => (
							<div
								key={i}
								class="bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700"
							>
								<a href="/">
									<img
										class="rounded-t-lg w-full"
										src={item.Poster}
										alt=""
									/>
								</a>
								<div class="p-5">
									<a href="/">
										<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
											{item.Title}
										</h5>
									</a>
									<p class="mb-3 font-normal text-gray-700 dark:text-gray-400">
										{item.Year.replace('–', '')} - {item.Type}
									</p>
									<a
										href="/"
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

const app = new App("#app", TestApp, {
	// dev: import.meta.env.DEV,
	dev: false,
});
app.use(
	makeRouter("#route", {
		resolve: "/test/index.html",
		url: [page("/", Index), page("/home", Home), page("", NotFound)],
	})
);
app.mount();
