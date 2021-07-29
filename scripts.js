"use strict";
const api = {
    get: "?act=get",
    new: "?act=new",
    upd: "?act=upd",
    del: "?act=del",
};
class Tree {
    async load() {
        let response = await fetch(api.get);
        let data = await response.json();
        for (let i in data)
            this[i] = data[i];
        //console.log(this);
    }
    async reload() {
        for (let i in this)
            delete this[i];
        await this.load();
    }
    async add(item) {
        let response = await fetch(api.new, {
            method: "POST",
            cache: "no-cache",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
        });
        item.id = await response.json(); // получим id созданного объекта
        item.name = clear(item.name);
        item.desc = clear(item.desc);
        this[item.id] = item;
        return item.id;
    }
    async edit(item) {
        let response = await fetch(api.upd, {
            method: "POST",
            cache: "no-cache",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
        });
        const ok = await response.json(); // убедимся, что запись завершена
        return ok;
    }
    async del(ids) {
        let response = await fetch(api.del, {
            method: "POST",
            cache: "no-cache",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ del: ids }),
        });
        const ok = await response.json();
        if (ok)
            ids.forEach(id => delete tree[id]);
        return ok;
    }
    hasChilds(id) {
        for (let i in this)
            if (this[i].pid == id)
                return true;
        return false;
    }
}
let tree = new Tree();
tree.load().then(() => showTree(0));
const showTree = (rootId) => {
    if (admin) {
        showButtonCreateItem();
        let count = 0;
        const stack = [];
        for (let id in tree) {
            let item = tree[id];
            if (!makeAdminItem(item))
                stack.push(item);
        }
        const max_iterations = (stack.length * (stack.length - 1)) / 2;
        while (stack.length && count++ <= max_iterations) {
            let item = stack.shift();
            if (item)
                if (!makeAdminItem(item))
                    stack.push(item);
        }
    }
    else {
        for (let id in tree) {
            if (tree[id].pid === rootId)
                makeUserItem(tree[id]);
        }
    }
};
/************************ Режим пользователя **************************************/
/* Строит блок для пользователя */
const makeUserItem = (item) => {
    var _a, _b;
    let root = document.querySelector(`#i${item.pid}`);
    let h = nested_header((_a = root.firstChild) === null || _a === void 0 ? void 0 : _a.nodeName);
    let div = document.createElement("div");
    div.className = "item user";
    div.id = `i${item.id}`;
    div.innerHTML =
        `<${h} class="name user">${item.name}</${h}>` +
            (((_b = item.desc) === null || _b === void 0 ? void 0 : _b.length)
                ? `<button onclick="showDescription(${item.id})">&#9776;</button>`
                : ``) +
            (tree.hasChilds(item.id)
                ? `<button data-open="false" onclick="toggleChilds(${item.id},this)">&#9660;</button>`
                : ``);
    root.append(div);
};
/* Строит отписание в отдельном блоке */
const showDescription = (id) => {
    let desc = document.querySelector("#description");
    let div;
    if (desc)
        div = desc;
    else {
        document.querySelector("#i0").className =
            "data description";
        div = document.createElement("div");
        div.className = "item_desc";
        div.id = "description";
        document.querySelector("#container").prepend(div);
    }
    div.innerHTML = `<button onclick="destroyDesc()">&#10006;</button>
					<p><u>${tree[id].name}</u></p><p>${tree[id].desc}</p>`;
};
/* Переключает потомков узла */
const toggleChilds = (id, button) => {
    if (button.dataset.open === "false") {
        button.dataset.open = "true";
        button.innerHTML = "&#9650;";
        showTree(id);
    }
    else {
        button.dataset.open = "false";
        button.innerHTML = "&#9660;";
        destroyChilds(id);
    }
};
/** скрывает потомков узла */
const destroyChilds = (id) => {
    const parent = document.querySelector(`#i${id}`);
    let child = parent.lastChild;
    while (child.nodeName === "DIV") {
        child.remove();
        child = parent.lastChild;
    }
};
/** Скрывает описание */
const destroyDesc = () => {
    var _a;
    document.querySelector("#i0").className = "data";
    (_a = document.querySelector("#description")) === null || _a === void 0 ? void 0 : _a.remove();
};
/********************************* РЕЖИМ АДМИНИСТРАТОРА ********************************/
/** Строит элемент в режиме администратора
 **	<<	true		удалось разместить узел (родитель существует)
 **	<<	false		узел не размещен (родитель еще не существует)
 */
const makeAdminItem = (item) => {
    var _a;
    let root = document.querySelector(`#i${item.pid}`);
    if (!root)
        return false;
    let h = nested_header((_a = root.firstChild) === null || _a === void 0 ? void 0 : _a.nodeName);
    let div = document.createElement("div");
    div.className = "item";
    div.id = `i${item.id}`;
    div.innerHTML =
        `<${h} class="name">${item.name}</${h}>` +
            `<p>${item.desc}</p>` +
            buildButtonsControl(item.id);
    root.append(div);
    return true;
};
/* ДОБАВЛЕНИЕ */
/* показывает форму для добавления элемента */
const showNewItem = (pid) => {
    var _a, _b, _c, _d;
    const fields = document.createElement("fieldset");
    fields.innerHTML = `<legend>Добавить вложенный в 
								<b>${(_b = (_a = tree[pid]) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "{Корень}"}</b>
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
    if (pid)
        (_c = document.querySelector(`#i${pid}`)) === null || _c === void 0 ? void 0 : _c.prepend(fields);
    else
        (_d = document.querySelector(`#i0`)) === null || _d === void 0 ? void 0 : _d.before(fields);
};
/* Добавляет новый объект в дерево */
const addItem = async (fields) => {
    const item = {
        id: 0,
        name: document.querySelector("#name").value,
        desc: document.querySelector("#desc").value,
        pid: Number.parseInt(document.querySelector("#pid").value),
    };
    const id = await tree.add(item);
    makeAdminItem(tree[id]);
    fields.remove();
};
/* РЕДАКТИРОВАНИЕ */
const makeEditFields = (id) => {
    var _a;
    destroyEditFields();
    const name = (document.querySelector(`#i${id}`).firstChild);
    const desc = document.querySelector(`#i${id} p`);
    const id_field = document.createElement("input");
    id_field.type = "hidden";
    id_field.id = "edit_id";
    id_field.value = id.toString();
    (_a = document.querySelector(`#i${id}`)) === null || _a === void 0 ? void 0 : _a.prepend(id_field);
    const name_field = document.createElement("input");
    name_field.id = "edit_name";
    name_field.value = name.innerText;
    name.after(name_field);
    const desc_field = document.createElement("textarea");
    desc_field.id = "edit_desc";
    desc_field.value = desc.innerText;
    desc.after(desc_field);
    const parent = (document.querySelector(`#i${id}`).parentElement);
    const pid_field = document.createElement("input");
    pid_field.type = "hidden";
    pid_field.id = "edit_pid";
    pid_field.value = parent.id.substring(1);
    desc_field.after(pid_field);
    const parent_name = document.createElement("span");
    parent_name.id = "edit_parent";
    parent_name.innerHTML = `Вложен в: <b>${pid_field.value !== "0"
        ? parent.firstChild.innerText
        : "{Корень}"}</b>
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
const destroyEditFields = () => {
    var _a, _b, _c, _d, _e, _f, _g;
    (_a = document.querySelector("#edit_id")) === null || _a === void 0 ? void 0 : _a.remove();
    (_b = document.querySelector("#edit_name")) === null || _b === void 0 ? void 0 : _b.remove();
    (_c = document.querySelector("#edit_desc")) === null || _c === void 0 ? void 0 : _c.remove();
    (_d = document.querySelector("#edit_pid")) === null || _d === void 0 ? void 0 : _d.remove();
    (_e = document.querySelector("#edit_parent")) === null || _e === void 0 ? void 0 : _e.remove();
    (_f = document.querySelector("#edit_save")) === null || _f === void 0 ? void 0 : _f.remove();
    (_g = document.querySelector("#edit_cancel")) === null || _g === void 0 ? void 0 : _g.remove();
    switchActiveHeaders(false);
};
const selectItem = (id) => {
    var _a, _b;
    document.querySelector("#edit_pid").value = id.toString();
    (document.querySelector("#edit_parent")).innerHTML = `Вложен в: 
			<b>${(_b = (_a = tree[id]) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "{Корень}"}</b> 
			<button onclick="switchActiveHeaders(true)" title="Выбрать">&#9757;</button>`;
    switchActiveHeaders(false);
};
const updateItem = async () => {
    const item = {
        id: Number.parseInt(document.querySelector("#edit_id").value),
        name: document.querySelector("#edit_name").value,
        desc: document.querySelector("#edit_desc").value,
        pid: Number.parseInt(document.querySelector("#edit_pid").value),
    };
    tree.edit(item);
    newDataContainer();
    await tree.reload();
    console.log(tree);
    showTree(0);
};
/* УДАЛЕНИЕ */
const deleteItem = async (id) => {
    var _a;
    const childs = document.querySelectorAll(`div#i${id} div`); // все вложенные узлы
    const ids = [id];
    childs.forEach(elem => ids.push(Number.parseInt(elem.id.substring(1)))); // соберем всех на удаление
    let ok = await tree.del(ids);
    if (ok)
        (_a = document.querySelector(`#i${id}`)) === null || _a === void 0 ? void 0 : _a.remove();
};
/***************************** Вспомогательные **************************************************/
const nested_header = (el) => {
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
const clear = (str) => str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const showButtonCreateItem = () => {
    var _a;
    const div = document.createElement("div");
    div.innerHTML = `<button id="create" onclick="showNewItem(0)" title="Создать новый объект">&#10040;</button>`;
    (_a = document.querySelector("#container")) === null || _a === void 0 ? void 0 : _a.prepend(div);
};
const buildButtonsControl = (id) => `<button onclick="makeEditFields(${id})" title="Редактировать объект">&#9998;</button>` +
    `<button onclick="showNewItem(${id})" title="Добавить вложенный">&#10010;</button>` +
    `<button onclick="deleteItem(${id})" title="Удалить">&#10060;</button>`;
const newDataContainer = () => {
    var _a, _b;
    (_a = document.querySelector("#container")) === null || _a === void 0 ? void 0 : _a.remove();
    const div = document.createElement("div");
    div.id = "container";
    div.className = "container";
    div.innerHTML = `<div class="data" id="i0"><h1>Структура данных</h1></div>`;
    (_b = document.querySelector("header")) === null || _b === void 0 ? void 0 : _b.after(div);
};
const Selector = (event) => {
    const div = event.composedPath()[1];
    selectItem(Number.parseInt(div.id.substring(1)));
};
const switchActiveHeaders = (on) => {
    const classname = on ? "pick" : "name";
    const evenListener = on ? addEventListener : removeEventListener;
    for (let id in tree) {
        let h = (document.querySelector(`#i${id}`).firstChild);
        h.className = classname;
        on
            ? h.addEventListener("click", Selector)
            : h.removeEventListener("click", Selector);
    }
    let h = (document.querySelector(`#i0`).firstChild);
    h.className = classname;
    on
        ? h.addEventListener("click", Selector)
        : h.removeEventListener("click", Selector);
};
