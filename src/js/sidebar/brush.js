
// goya.sidebar.brush

{
	init() {

	},
	dispatch(event) {
		let APP = goya,
			Self = APP.sidebar.brush,
			list,
			entry,
			name,
			value,
			pEl,
			el;
		// console.log(event);
		switch (event.type) {
			case "set-variable":
				entry = STUDIO;
				list = event.arg.split(".");
				name = list.pop();
				list.map(item => (entry = entry[item]));
				entry[name] = event.value;
				break;
		}
	}
}
