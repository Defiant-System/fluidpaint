
const Files = {
	init() {
		// file stack
		this.stack = [];
		this.activeFile = null;
	},
	open(fsFile, opt) {
		// create file
		let file = new File(fsFile, opt);
		let xNode = file._file.xNode;
		let fileId = file._file.id;

		// add to stack
		this.stack.push(file);

		// select newly added file
		this.select(fileId);
	},
	close(id) {
		this.activeFile.dispatch({ type: "close-file" });
	},
	select(id) {
		// reference to active file
		this.activeFile = this.stack.find(f => f._file.id === id);
	}
};

// auto init
Files.init();
