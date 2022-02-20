
// goya.blankView

{
	init() {
		// fast references
		this.els = {
			doc: $(document),
			content: window.find("content"),
			el: window.find(".blank-view"),
		};

		// get settings, if any
		let xList = $.xmlFromString(`<Recents>
				<i name="basketball.png" filepath="/fs/Desktop/images/basketball.png"/>
				<i name="coast.jpg" filepath="/fs/Desktop/coast.jpg"/>
			</Recents>`);
		let xPreset = window.bluePrint.selectSingleNode(`//Presets`);

		this.xRecent = window.settings.getItem("recents") || xList.documentElement;
		// add recent files in to data-section
		xPreset.parentNode.append(this.xRecent);

		// setTimeout(() => {
		// 	window.find(".preset:nth(0)").trigger("click");
		// }, 500);
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
				let xFile = $.nodeFromString(`<i name="${event.file.base}" filepath="${event.file.path}"/>`);
				Self.xRecent.appendChild(xFile);
				break;
			case "open-filesystem":
				window.dialog.open({
					jpg: item => Self.dispatch(item),
					jpeg: item => Self.dispatch(item),
					png: item => Self.dispatch(item),
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