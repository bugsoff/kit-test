export const nested_header = (el: string | undefined): string => {
	switch (el) {
		case "H2":
			return "h3";
		case "H3":
			return "h4";
		case "H4":
			return "h5";
		case "H5":
			return "h6";
		case "H6":
			return "h6";
		default:
			return "h2";
	}
};

export const clear = (str: string): string =>
	str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

export const showButtonCreateItem = (): void => {
	const div: HTMLDivElement = document.createElement("div");
	div.innerHTML = `<button id="create" onclick="newItem(0)" title="Создать новый объект">&#10040;</button>`;
	document.querySelector("#container")?.prepend(div);
};

export const buildButtonsControl = (id: number): string =>
	`<button onclick="makeEditFields(${id})" title="Редактировать объект">&#9998;</button>` +
	`<button onclick="showNewItem(${id})" title="Добавить вложенный">&#10010;</button>` +
	`<button onclick="deleteItem(${id})" title="Удалить">&#10060;</button>`;

export const newDataContainer = () => {
	document.querySelector("#container")?.remove();
	const div = document.createElement("div");
	div.id = "container";
	div.className = "container";
	div.innerHTML = `<div class="data" id="i0"><h1>Структура данных</h1></div>`;
	document.querySelector("header")?.after(div);
};
