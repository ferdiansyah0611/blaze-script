export default function Dialog() {
	this.disableExtension = true;
	// @ts-ignore
	const { render, defineProp, effect, state } = init(this);
	defineProp({
		open: false,
		data: "",
		handle: null
	})
	state("data", {
		value: ""
	})
	effect(() => {
		this.data.value = this.props.data
	})
	render(() => {
		const { open, handle, closeDialog } = this.props;
		const { value } = this.data
		return (
			<div className={["dialog_root", open ? "active" : ""]}>
				<div className="dialog_body">
					<div className="dialog_title">
						<h1>Edit Data</h1>
					</div>
					<div refs="body" className="body p-2" contentEditable>{value}</div>
					<div className="action">
						<button onClick={() => {
							handle(JSON.parse(this.body.innerText))
							closeDialog()
						}} className="btn-primary p-2">Save</button>
						<button onClick={closeDialog} className="btn-secondary p-2">Close</button>
					</div>
				</div>
			</div>
		);
	});
}