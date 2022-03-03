
// goya.blankView

{
	init() {
		// fast references
		this.els = {
			doc: $(document),
			content: window.find("content"),
			el: window.find(".blank-view"),
		};
		// window.settings.clear();

		// get settings, if any
		let xList = $.xmlFromString(`<Recents/>`);
		let xPreset = window.bluePrint.selectSingleNode(`//Presets`);
		this.xRecent = window.settings.getItem("recents") || xList.documentElement;

		Promise.all(this.xRecent.selectNodes("./*").map(async xItem => {
				let filepath = xItem.getAttribute("filepath"),
					check = await defiant.shell(`fs -f '${filepath}'`);
				if (!check.result) {
					xItem.parentNode.removeChild(xItem)
				}
			}))
			.then(() => {
				// add recent files in to data-section
				xPreset.parentNode.append(this.xRecent);
		
				// render blank view
				window.render({
					template: "blank-view",
					match: `//Data`,
					target: goya.els.blankView
				});

				// setTimeout(() => window.find(".preset:nth(0)").trigger("click"), 100);
				// setTimeout(() => goya.dispatch({ type: "close-file" }), 500);
			});
	},
	dispatch(event) {
		let APP = goya,
			Self = APP.blankView,
			name,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			case "add-recent-file":
				let str = `<i name="${event.file.base}" filepath="${event.file.path}"/>`,
					xFile = $.nodeFromString(str),
					xExist = Self.xRecent.selectSingleNode(`//Recents/*[@filepath="${event.file.path}"]`);
				// remove entry if already exist
				if (xExist) xExist.parentNode.removeChild(xExist);
				// insert new entry at first position
				Self.xRecent.insertBefore(xFile, Self.xRecent.firstChild);
				break;
			case "open-filesystem":
				window.dialog.open({
					jpg: item => APP.dispatch(item),
					jpeg: item => APP.dispatch(item),
					png: item => APP.dispatch(item),
				});
				break;
			case "from-clipboard":
				// TODO
				break;
			case "select-preset":
				el = $(event.target);
				if (!el.hasClass("preset")) return;
				// window.tabs.add("test");

				value = {
					bg: el.data("bg"),
					width: +el.data("width"),
					height: +el.data("height"),
				};
				APP.dispatch({ type: "new-file", value });
				break;
			case "select-recent-file":
				el = $(event.target);
				if (!el.hasClass("recent-file")) return;
				
				defiant.shell(`fs -o '${el.data("file")}' null`)
					.then(exec => APP.dispatch(exec.result));
				break;
		}
	}
}