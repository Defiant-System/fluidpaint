
// goya.sidebar

{
	init() {
		// fast references
		this.els = {
			doc: $(document),
			content: window.find("content"),
			el: window.find("sidebar"),
		};
		
		// init all sub-objects
		Object.keys(this)
			.filter(i => typeof this[i].init === "function")
			.map(i => this[i].init(this));

		// temp
		// this.els.content.find(`.sidebar-head span:nth-child(3)`).trigger("click");

		// let r = Math.round(Math.random() * 15) + 1;
		// this.els.content.find(`.palette span:nth-child(${r})`).trigger("click");
	},
	dispatch(event) {
		let APP = goya,
			Self = APP.sidebar,
			list,
			entry,
			name,
			value,
			pEl,
			el;
		// console.log(event);
		switch (event.type) {
			case "toggle-sidebar":
				value = Self.els.content.hasClass("show-sidebar");
				Self.els.content.toggleClass("show-sidebar", value);
				return !value;
			case "select-tab":
				event.el.find(".active").removeClass("active");
				el = $(event.target).addClass("active");
				
				pEl = event.el.parent();
				pEl.find(".sidebar-body.active").removeClass("active");
				pEl.find(".sidebar-body").get(el.index()).addClass("active");
				break;
			case "set-variable":
				entry = STUDIO;
				list = event.arg.split(".");
				name = list.pop();
				list.map(item => (entry = entry[item]));
				entry[name] = event.value;
				break;
			default:
				el = event.el || (event.origin && event.origin.el) || $(event.target);
				pEl = el.parents("[data-section]");
				name = pEl.data("section");
				if (Self[name]) {
					return Self[name].dispatch(event);
				}
		}
	},
	colors: @import "./colors.js",
	brush: @import "./brush.js",
	layers: @import "./layers.js",
}