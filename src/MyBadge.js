export class MyBadge {
	constructor(title, details, appearance) {
		this.title = title;
		this.details = details;
		this.appearance = appearance;
	}

	toString() {
		return '' + this.title + (this.details ? ' (' + this.details + ')' : '')
	}
}
