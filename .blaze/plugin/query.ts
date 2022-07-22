import Dexie from "dexie";

export default function query(url, config): void {
	const name = config.as;
	const db = new Dexie("query");
	const result = async () => config.handle(await db[name].toArray())

	db.version(1).stores({
		[name]: "$i," + config.table,
	});
	db[name].count(async (total) => {
		try {
			let getExpired = localStorage.getItem(name)
			if (total || (getExpired && Date.now() < parseInt(getExpired))) {
				result();
				return;
			} else {
				localStorage.setItem(name, config.expired);

				const request = (config.with || fetch)(url, config.option || {});
				let data = await request;
				if (data.json) {
					data = await data.json();
				}
				if (config.select) {
					data = data[config.select];
				}
				if (Array.isArray(data)) {
					await db[name].bulkPut(
						data.map((item, i) => {
							item.$i = i;
							return item;
						})
					);
					result();
					return;
				}
				if (typeof data === "object") {
				}
			}
		} catch (error) {
			console.log(error);
			if (config.error) {
				config.error();
			}
		}
	});
}
