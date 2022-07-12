type Helmet = {
	title? : string;
	description? : string;
}


export default function helmet(data: Helmet = {}){
	if(data.title) {
		document.title = data.title
	}
	if(data.description) {
		let description = document.querySelector('meta[name="description"]');
		description['content'] = data.title
	}
}