import App, { render, state, init, mount, watch } from "@blaze";
import { makeRouter, page } from "@blaze.router";
import Button from "./component/Button";
import Navbar from "./component/Navbar";

const TestApp = function () {
	init(this);

	render(
		() => (
			<>
				<div f>
					<Navbar />
					<div d id="route"></div>
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
			let data = await fetch('https://newsapi.org/v2/everything?q=tesla&from=2022-06-09&sortBy=publishedAt&apiKey=df3da34a7b1f4418b9c1c4eecd15927c')
			data = await data.json()
			commit = data.articles
			localStorage.setItem('news', JSON.stringify(data))
		} else {
			commit = JSON.parse(local).articles
		}
		this.blog.data = commit.slice(0, this.blog.page * 9)
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
					<div class="grid gap-2 grid-cols-2 md:grid-cols-4" for="blog.data">
						{this.blog.data.map((item, i) => (
							<div>
								<img src={item.urlToImage} alt="" />
								<p>{item.title}</p>
								<Button
									onClick={() =>
										window.open(item.url)
									}
									color="purple"
									text="View"
									key={i}
									style="margin-top: 5px;"
								/>
							</div>
						))}
					</div>
					<Button
						onClick={() =>
							this.blog.page += 1
						}
						color="purple"
						text="Next"
						key={99}
						style="margin-top: 5px;"
					/>
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
