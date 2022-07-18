import { init } from "@blaze";
// component
import Button from "../component/Button";
import Card from "../component/Card";
// store
import blog from "../store/blog";

const Index = function () {
	const { render, mount, batch, dispatch, layout, state } = init(this);
	const endpoint = "https://dev.to/api/";

	blog(this);

	const pagination = (type) => {
		if (type === null) return true;
		else if (type) return dispatch('blog.nextPage');
		else if (!type) return dispatch('blog.prevPage');
	};
	const getNews = async (type) => {
		await batch(async () => {
			try{
				pagination(type);
				let data = await fetch(endpoint + "articles?page=" + this.ctx.blog.page);
				data = await data.json();
				this.ctx.blog.data = data.slice(0, 28);
				window.scrollTo(0, 0)
				return Promise.resolve(true);
			}catch(err){
				
			}
		}, this);
	};

	mount(() => {
		if(!this.ctx.blog.data.length) {
			getNews(null);
		}
		console.log('mount')
		return() => console.log('unmount')
	}, this);
	layout(() => {
		console.log('layout', this.$node?.isConnected)
	})
	let prev = () => getNews(false)
	let next = () => getNews(true)
	render(
		() => (
			<>
				<div refs="hi" className="p-4 min-h-screen">
					<div for={this.ctx.blog.data} id="blog" className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
						{this.ctx.blog.data.map((item, i) => (
							<Card item={item} key={item.id}/>
						))}
					</div>
					<div className="flex justify-center space-x-2">
						<Button
							onClick={prev}
							color="primary"
							text="Previous"
							key={1000}
							style="margin-top: 15px;"
							data-test="2"
						/>
						<Button
							onClick={next}
							color="primary"
							text="Next"
							key={1001}
							style={{marginTop: 15}}
							data-test="1"
						/>
					</div>
				</div>
			</>
		),
		this
	);
};

export default Index;


const TestLogic = function () {
	init(this);
	state("state", {
		number: 0,
	}, this)
	render(() => {
		return(
			<>
				<div if={this.state.number > 2}>
					<p>{this.state.number}</p>
				</div>
				<div>
					<button onClick={() => this.state.number++}>click</button>
				</div>
			</>
		)
	}, this)
}