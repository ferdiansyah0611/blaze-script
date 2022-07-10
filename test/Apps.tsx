import App, { render, state, init, mount, watch } from "@blaze";
import { makeRouter, page } from "@blaze.router";
import Button from "./component/Button";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";

const TestApp = function () {
	init(this);

	render(
		() => (
			<>
				<div d>
					<Navbar />
					<div d id="route"></div>
					<Footer/>
				</div>
			</>
		),
		this
	);
};
const Index = function () {
	init(this);
	state(
		"blog",
		{
			data: [],
			page: 1
		},
		this
	);
	const getNews = async () => {
		let local = localStorage.getItem('news')
		let commit = []
		if(!local) {
			let now = new Date()
			let year = now.getFullYear();
			let month = now.getMonth() + 1;
			let date = now.getDate();
			let dateParse = `${year}-${month < 10 ? `0${month}` : month}-${date < 10 ? `0${date}` :date}`;
			let data = await fetch(`https://newsapi.org/v2/everything?q=tesla&from=${dateParse}&sortBy=publishedAt&apiKey=df3da34a7b1f4418b9c1c4eecd15927c`)
			data = await data.json()
			commit = data.articles
			localStorage.setItem('news', JSON.stringify(data))
		} else {
			commit = JSON.parse(local).articles
		}
		this.blog.data = (commit ? commit.slice(0, this.blog.page * 8) : [])
	}
	mount(() => {
		getNews()
	}, this);
	watch(['blog.page'], (name, value) => {
		getNews()
	}, this)
	render(
		() => (
			<>
				<div className="p-4">
					<div className="grid gap-2 grid-cols-2 md:grid-cols-4">
						{this.blog.data.map((item, i) => (
							<div key={i} class="bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
								<a href="#">
									<img
										class="rounded-t-lg"
										src={item.urlToImage}
										alt=""
									/>
								</a>
								<div class="p-5">
									<a href="#">
										<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
											{item.title}
										</h5>
									</a>
									<p class="mb-3 font-normal text-gray-700 dark:text-gray-400">
										{item.description}
									</p>
									<a
										href="#"
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
							onClick={() =>
								this.blog.page += 1
							}
							color="primary"
							text="Next"
							key={99}
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
