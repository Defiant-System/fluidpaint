
// goya.sidebar.colors

{
	init() {

	},
	dispatch(event) {
		let APP = goya,
			Self = APP.sidebar.colors,
			name,
			value,
			pEl,
			el;
		// console.log(event);
		switch (event.type) {
			case "select-color":
				if (event.el[0] === event.target) return;

				event.el.find(".active").removeClass("active");
				el = $(event.target).addClass("active");
				value = "#"+ el.attr("style").split("#")[1].slice(0,6);
				value = Color.hexToHsv(value);

				painter.brushColorHSVA = value;
				picker.draw();
				break;
		}
	}
}
