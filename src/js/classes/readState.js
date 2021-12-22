
class ReadState extends State {
	constructor(wgl) {
		super(wgl, wgl);
	}

	bindFramebuffer(framebuffer) {
		this.setParameter("framebuffer", [framebuffer]);
		return this;
	}
}
