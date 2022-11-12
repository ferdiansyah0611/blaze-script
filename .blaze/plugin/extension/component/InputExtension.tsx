export default function InputExtension() {
	this.disableExtension = true;
	// @ts-ignore
	const { render } = init(this);
	const handle = (val) => {
		let { value, onChange } = this.props;
		if (val.type && val.type === 'change') {
			val = val.target.checked
		}
		onChange ? onChange(typeof value === "number" ? parseInt(val) : val) : (value = val)
	}
	render(() => {
		let { name, value, disableMargin, openDialog } = this.props;
		return (
			<div class={"flex space-x-2 items-center mt-1 text-sm p-2" + (disableMargin ? "" : " ml-2")}>
				<p class="p-2 flex-1">
					<span>{name}</span>
					<span class="p-2 italic flex-1 text-green-400">
						{Array.isArray(value) ? `Array[${value.length}]` : typeof value}
					</span>
				</p>
				<div
					if={typeof value === 'boolean'}
				>
					<input
						type="checkbox"
						onChange={handle}
						checked={value}
					/>
				</div>
				<div else>
					{
						(Array.isArray(value) || typeof value === 'object') ?
							<button class="btn-primary p-2" onClick={() => openDialog(value, handle)}>edit</button>
						:
							<input
								class="bg-black text-white p-2 flex-1 focus:outline-none"
								value={value}
								onChangeValue={handle}
								type={typeof value === "number" ? "number" : "text"}
								disabled={name === "key" || ["function", "object"].includes(typeof value)}
								style={{paddingRight: '10px', width: '-webkit-fill-available'}}
							/>
					}
				</div>
			</div>
		);
	});
}