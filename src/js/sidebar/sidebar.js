
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
		this.els.content.find(`.sidebar-head span:nth-child(1)`).trigger("click");

		// let r = Math.round(Math.random() * 15) + 1;
		// this.els.content.find(`.palette span:nth-child(${r})`).trigger("click");
	},
	dispatch(event) {
		let APP = goya,
			Self = APP.sidebar,
			name,
			value,
			pEl,
			el;
		switch (event.type) {
			case "toggle-sidebar":
				value = Self.els.content.hasClass("show-sidebar");
				Self.els.content.toggleClass("show-sidebar", value);
				return !value;
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