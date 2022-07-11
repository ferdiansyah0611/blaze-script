import { context } from "@blaze";

const blog = context(
	"blog",
	{
		data: [],
		page: 1,
	},
	{
		nextPage(state) {
			state.page++;
		},
		prevPage(state) {
			state.page--;
		},
	}
);

export default blog;
