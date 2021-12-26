
// goya.tools.pan

{
	init() {
		
	},
	dispatch(event) {
		let APP = goya,
			Self = APP.tools.pan,
			el;
		// console.log(event);
		switch (event.type) {
			case "blur-tool":
				break;
			case "focus-tool":
				// update interaction state
				STUDIO.painter.interactionState = InteractionMode.PANNING;
				break;
		}
	}
}