// @ts-ignore
export default function ListExtension() {
	this.disableExtension = true;
	const { render, defineProp, mount } = init(this);
	defineProp({
		item: {
			$node: {
				$name: ''
			},
			props: {
				key: 0
			}
		},
	})
	render(() => {
		let registry = this.props.item.$deep.registry.value;
		return (
			<div style={this.props.style || ""} class="flex-1">
				<button
					onClick={() => this.props.setSelectComponent(this.props.item)}
					class="bg-gray-800 p-2 w-full rounded-md mb-1 text-sm text-left"
					data-search={this.props.item?.$node?.$name.toLowerCase()}
					data-i={this.props.item?.props?.key || 0}
				>
					{"<"}{this.props.item?.$node?.$name}{this.props.item?.props?.key ? ` key="${this.props.item?.props?.key}"` : ""}{"/>"}
				</button>
				{Object.keys(registry).map((item, i) => (
					<ListExtension
						current={this.props.current + 1}
						style={`margin-left: ${(this.props.current + 1) * 20}px;`}
						key={i + 1}
						setSelectComponent={this.props.setSelectComponent}
						item={registry[item]}
					/>
				))}
			</div>
		);
	});
}