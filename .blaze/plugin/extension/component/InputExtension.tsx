import { init } from "@blaze";

export default function InputExtension() {
	this.disableExtension = true;
	const { render } = init(this);
	render(() => {
		let { name, value, disableMargin, onChange } = this.props;
		return (
			<div class={"flex space-x-2 items-center mt-1 text-sm p-2" + (disableMargin ? "" : " ml-2")}>
				<p class="p-2 flex-1">{name}</p>
				<input
					class="bg-black text-white p-2 flex-1 focus:outline-none"
					value={value}
					onChangeValue={(val) => (onChange ? onChange(val) : (value = val))}
					type={typeof value === "number" ? "number" : "text"}
					disabled={name === "key" || ["function", "object"].includes(typeof value)}
				/>
				<p class="p-2 italic flex-1 text-green-400">
					{Array.isArray(value) ? `Array[${value.length}]` : typeof value}
				</p>
			</div>
		);
	});
}