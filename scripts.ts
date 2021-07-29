declare var admin: boolean;

const api = {
	get: "?act=get",
	new: "?act=new",
	upd: "?act=upd",
	del: "?act=del",
};

type treeItem = {id: number; name: string; desc: string; pid: number};

class Tree {
	[key: number]: treeItem;

	/* Загрузка элементов из БД */
	async load() {
		let response = await fetch(api.get);
		let data: treeItem[] = await response.json();
		for (let i in data) this[i] = data[i];
		//console.log(this);
	}

	/* Удаление старых и загрузка элементов из БД */
	async reload() {
		for (let i in this) delete this[i];
		await this.load();
	}

	/* Сохранение в БД Нового элемента */
	async add(item: treeItem): Promise<number> {
		let response = await fetch(api.new, {
			method: "POST",
			cache: "no-cache",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(item),
		});
		item.id = await response.json(); // получим id созданного объекта
		item.name = clear(item.name);
		item.desc = clear(item.desc);
		this[item.id] = item;
		return item.id;
	}

	/* Обновление элемента в БД */
	async edit(item: treeItem): Promise<boolean> {
		let response = await fetch(api.upd, {
			method: "POST",
			cache: "no-cache",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(item),
		});
		const ok = await response.json(); // убедимся, что запись завершена
		return ok;
	}

	/* Удаление элемента из БД */
	async del(ids: number[]): Promise<boolean> {
		let response = await fetch(api.del, {
			method: "POST",
			cache: "no-cache",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({del: ids}),
		});
		const ok = await response.json();
		if (ok) ids.forEach(id => delete tree[id]);
		return ok;
	}

	/* Проверяет есть ли потомки у элемента */
	hasChilds(id: number): boolean {
		for (let i in this) if (this[i].pid == id) return true;
		return false;
	}
}

let tree: Tree = new Tree();

tree.load().then(() => showTree(0)); // начальная загрузка и отрисовка дерева

/* Строит дерево, начиная с узла с номером rootId */
const showTree = (rootId: number): void => {
	if (admin) {
		// узлы в режиме администратора
		showButtonCreateItem();
		let count = 0;
		const stack: treeItem[] = [];
		for (let id in tree) {
			let item = tree[id];
			if (!makeAdminItem(item)) stack.push(item); // если не все узла удалось разместить - созраняем в стек
		}
		const max_iterations = (stack.length * (stack.length - 1)) / 2; // максимальное число итераций, если все узлы в обратном порядке
		while (stack.length && count++ <= max_iterations) {
			// размещаем сохраненные в стеке узлы
			let item: treeItem | undefined = stack.shift();
			if (item) if (!makeAdminItem(item)) stack.push(item);
		}
	} else {
		// узлы в режиме пользователя
		for (let id in tree) {
			if (tree[id].pid === rootId) makeUserItem(tree[id]); // размещаем только узлы текущего уровня
		}
	}
};

/************************ Режим пользователя **************************************/

/* Строит блок для пользователя */
const makeUserItem = (item: treeItem): void => {
	let root: HTMLDivElement = document.querySelector(`#i${item.pid}`)!;
	let h: string = nested_header(root.firstChild?.nodeName);
	let div: HTMLDivElement = document.createElement("div");
	div.className = "item user";
	div.id = `i${item.id}`;
	div.innerHTML =
		`<${h} class="name user">${item.name}</${h}>` +
		(item.desc?.length
			? `<button onclick="showDescription(${item.id})">&#9776;</button>`
			: ``) +
		(tree.hasChilds(item.id)
			? `<button data-open="false" onclick="toggleChilds(${item.id},this)">&#9660;</button>`
			: ``);
	root.append(div);
};

/* Строит отписание в отдельном блоке */
const showDescription = (id: number): void => {
	let desc: HTMLDivElement | null = document.querySelector("#description");
	let div: HTMLDivElement;
	if (desc) div = desc;
	else {
		(<HTMLDivElement>document.querySelector("#i0")).className =
			"data description";
		div = document.createElement("div");
		div.className = "item_desc";
		div.id = "description";
		document.querySelector("#container")!.prepend(div);
	}
	div.innerHTML = `<button onclick="destroyDesc()">&#10006;</button>
					<p><u>${tree[id].name}</u></p><p>${tree[id].desc}</p>`;
};

/* Переключает отображение потомков узла */
const toggleChilds = (id: number, button: HTMLButtonElement): void => {
	if (button.dataset.open === "false") {
		button.dataset.open = "true";
		button.innerHTML = "&#9650;";
		showTree(id);
	} else {
		button.dataset.open = "false";
		button.innerHTML = "&#9660;";
		destroyChilds(id);
	}
};

/* Удаляет потомков узла */
const destroyChilds = (id: number): void => {
	const parent: HTMLDivElement = document.querySelector(`#i${id}`)!;
	let child: ChildNode = parent.lastChild!;
	while (child.nodeName === "DIV") {
		child.remove();
		child = parent.lastChild!;
	}
};

/* Удаляет блок описания */
const destroyDesc = (): void => {
	(<HTMLDivElement>document.querySelector("#i0")).className = "data";
	document.querySelector("#description")?.remove();
};

/********************************* РЕЖИМ АДМИНИСТРАТОРА ********************************/

/** Строит элемент в режиме администратора
 **	<<	true		удалось разместить узел (родитель существует)
 **	<<	false		узел не размещен (родитель еще не существует)
 */
const makeAdminItem = (item: treeItem): boolean => {
	let root: HTMLDivElement | null = document.querySelector(`#i${item.pid}`);
	if (!root) return false;
	let h: string = nested_header(root.firstChild?.nodeName);
	let div: HTMLDivElement = document.createElement("div");
	div.className = "item";
	div.id = `i${item.id}`;
	div.innerHTML =
		`<${h} class="name">${item.name}</${h}>` +
		`<p>${item.desc}</p>` +
		buildButtonsControl(item.id);
	root.append(div);
	return true;
};

/* ---- ДОБАВЛЕНИЕ ЭЛЕМЕНТОВ ---- */

/* показывает форму для добавления элемента */
const showNewItem = (pid: number): void => {
	const fields = document.createElement("fieldset");
	fields.innerHTML = `<legend>Добавить вложенный в 
								<b>${tree[pid]?.name ?? "{Корень}"}</b>
						</legend>
		<label>Название:
			<input type="text" maxlength="255" id="name" name="name"/>
		</label>
		<label>Описание:
			<textarea maxlength="16384" name="desc" id="desc">
			</textarea>
		</label>
		<input type="hidden" name="pid" id="pid" value="${pid}">		
		<button id="buttonAdd" onclick="addItem(this.parentNode)" title="Добавить">&#9989;</button>
		<button onclick="this.parentNode.remove()" title="Отмена">&#9940;</button>	
		`;
	if (pid) document.querySelector(`#i${pid}`)?.prepend(fields);
	else document.querySelector(`#i0`)?.before(fields);
};

/* Добавляет новый объект в дерево */
const addItem = async (fields: HTMLFieldSetElement) => {
	const item: treeItem = {
		id: 0,
		name: (<HTMLInputElement>document.querySelector("#name")).value,
		desc: (<HTMLTextAreaElement>document.querySelector("#desc")).value,
		pid: Number.parseInt(
			(<HTMLInputElement>document.querySelector("#pid")).value
		),
	};
	const id = await tree.add(item);
	makeAdminItem(tree[id]);
	fields.remove();
};

/* ---- РЕДАКТИРОВАНИЕ ---- */

/* Строит поля редактирования элемента */
const makeEditFields = (id: number) => {
	destroyEditFields();
	const name: HTMLParagraphElement = <HTMLHeadingElement>(
		document.querySelector(`#i${id}`)!.firstChild!
	);
	const desc: HTMLParagraphElement = document.querySelector(`#i${id} p`)!;
	const id_field = document.createElement("input");
	id_field.type = "hidden";
	id_field.id = "edit_id";
	id_field.value = id.toString();
	document.querySelector(`#i${id}`)?.prepend(id_field);
	const name_field = document.createElement("input");
	name_field.id = "edit_name";
	name_field.value = name.innerText;
	name.after(name_field);
	const desc_field = document.createElement("textarea");
	desc_field.id = "edit_desc";
	desc_field.value = desc.innerText;
	desc.after(desc_field);
	const parent: HTMLDivElement = <HTMLDivElement>(
		document.querySelector(`#i${id}`)!.parentElement
	);
	const pid_field = document.createElement("input");
	pid_field.type = "hidden";
	pid_field.id = "edit_pid";
	pid_field.value = parent.id.substring(1);

	desc_field.after(pid_field);
	const parent_name = document.createElement("span");
	parent_name.id = "edit_parent";
	parent_name.innerHTML = `Вложен в: <b>${
		pid_field.value !== "0"
			? (<HTMLHeadingElement>parent.firstChild).innerText
			: "{Корень}"
	}</b>
	<button onclick="switchActiveHeaders(true)" title="Выбрать">&#9757;</button>`;
	pid_field.after(parent_name);
	const save_button = document.createElement("button");
	save_button.addEventListener("click", () => updateItem());
	save_button.id = "edit_save";
	save_button.title = "Сохранить";
	save_button.innerHTML = "&#9989;";
	const cancel_button = document.createElement("button");
	cancel_button.addEventListener("click", () => destroyEditFields());
	cancel_button.id = "edit_cancel";
	cancel_button.title = "Отменить";
	cancel_button.innerHTML = "&#9940;";
	parent_name.after(save_button);
	save_button.after(cancel_button);
};

/* Удаляет поля редактировая элемента */
const destroyEditFields = () => {
	document.querySelector("#edit_id")?.remove();
	document.querySelector("#edit_name")?.remove();
	document.querySelector("#edit_desc")?.remove();
	document.querySelector("#edit_pid")?.remove();
	document.querySelector("#edit_parent")?.remove();
	document.querySelector("#edit_save")?.remove();
	document.querySelector("#edit_cancel")?.remove();
	switchActiveHeaders(false);
};

/* Сохраняет в форму выбор родительского элемента */
const selectItem = (id: number): void => {
	(<HTMLInputElement>document.querySelector("#edit_pid")).value = id.toString();
	(<HTMLSpanElement>(
		document.querySelector("#edit_parent")
	)).innerHTML = `Вложен в: 
			<b>${tree[id]?.name ?? "{Корень}"}</b> 
			<button onclick="switchActiveHeaders(true)" title="Выбрать">&#9757;</button>`;
	switchActiveHeaders(false);
};

/* Обновляет элемент в БД и перестраивает дерево */
const updateItem = async () => {
	const item: treeItem = {
		id: Number.parseInt(
			(<HTMLInputElement>document.querySelector("#edit_id")).value
		),
		name: (<HTMLInputElement>document.querySelector("#edit_name")).value,
		desc: (<HTMLTextAreaElement>document.querySelector("#edit_desc")).value,
		pid: Number.parseInt(
			(<HTMLTextAreaElement>document.querySelector("#edit_pid")).value
		),
	};
	tree.edit(item);
	newDataContainer();
	await tree.reload();	
	showTree(0);
};

/* ---- УДАЛЕНИЕ ---- */
const deleteItem = async (id: number) => {
	const childs = document.querySelectorAll(`div#i${id} div`); // все вложенные узлы
	const ids: number[] = [id];
	childs.forEach(elem => ids.push(Number.parseInt(elem.id.substring(1)))); // соберем всех на удаление
	let ok = await tree.del(ids);
	if (ok) document.querySelector(`#i${id}`)?.remove();
};


/***************************** Вспомогательные **************************************************/

/* Определяет заголовок в зависимости от уровня вложенности */
const nested_header = (el: string | undefined): string => {
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

/* Фильтрует HTML-сущности в полях */
const clear = (str: string): string =>
	str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

/* кнопка создания нового элемента */
const showButtonCreateItem = (): void => {
	const div: HTMLDivElement = document.createElement("div");
	div.innerHTML = `<button id="create" onclick="showNewItem(0)" title="Создать новый объект">&#10040;</button>`;
	document.querySelector("#container")?.prepend(div);
};

/* Кнопки управления элементом */
const buildButtonsControl = (id: number): string =>
	`<button onclick="makeEditFields(${id})" title="Редактировать объект">&#9998;</button>` +
	`<button onclick="showNewItem(${id})" title="Добавить вложенный">&#10010;</button>` +
	`<button onclick="deleteItem(${id})" title="Удалить">&#10060;</button>`;

/* Ощищает контейнер с данными */
const newDataContainer = () => {
	document.querySelector("#container")?.remove();
	const div = document.createElement("div");
	div.id = "container";
	div.className = "container";
	div.innerHTML = `<div class="data" id="i0"><h1>Структура данных</h1></div>`;
	document.querySelector("header")?.after(div);
};

/* Обработчик события по выбору родительского элемента */
const Selector = (event: MouseEvent) => {
	const div: HTMLDivElement = <HTMLDivElement>event.composedPath()[1];
	selectItem(Number.parseInt(div.id.substring(1)));
};

/* Делает заголовки элементов активными (доступными для выбора) или отключает это */
const switchActiveHeaders = (on: boolean) => {
	const classname = on ? "pick" : "name";
	const evenListener = on ? addEventListener : removeEventListener;
	for (let id in tree) {
		let h: HTMLHeadingElement = <HTMLHeadingElement>(
			document.querySelector(`#i${id}`)!.firstChild!
		);
		h.className = classname;
		on
			? h.addEventListener("click", Selector)
			: h.removeEventListener("click", Selector);
	}
	let h: HTMLHeadingElement = <HTMLHeadingElement>(
		document.querySelector(`#i0`)!.firstChild!
	);
	h.className = classname;
	on
		? h.addEventListener("click", Selector)
		: h.removeEventListener("click", Selector);
};
