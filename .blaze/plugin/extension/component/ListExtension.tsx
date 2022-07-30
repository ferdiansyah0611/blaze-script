import { init } from "@blaze";

export default function ListExtension() {
	this.disableExtension = true;
	const { render, defineProp } = init(this);
	defineProp({
		item: {
			constructor: {
				name: ''
			}
		}
	})
	render(() => {
		return (
			<div style={this.props.style || ""} class="flex-1">
				<button
					onClick={() => this.props.setSelectComponent(this.props.item)}
					class="bg-gray-800 p-2 w-full rounded-md mb-1 text-sm text-left"
					data-search={this.props.item.constructor.name.toLowerCase()}
					data-i={this.props.item.props.key || 0}
				>
					{"<"}{this.props.item.constructor.name}{this.props.item.props.key ? ` key="${this.props.item.props.key}"` : ""}{"/>"}
				</button>
				{this.props.item.$deep.registry.map((item, i) => (
					<ListExtension
						current={this.props.current + 1}
						style={`margin-left: ${(this.props.current + 1) * 20}px;`}
						key={i + 1}
						setSelectComponent={this.props.setSelectComponent}
						item={item.component}
					/>
				))}
			</div>
		);
	});
}