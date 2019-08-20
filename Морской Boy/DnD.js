function Instance() {
	this.pressed = false; // левая кнопка мышки не нажата
}

// создаём экземпляр объекта с помощью конструктора Instance
var instance = new Instance();
// и устанавливаем обработчики событий мыши

Instance.prototype.setObserver = function() {
// поле для кораблей игрока
var fieldUser = getElement('#ContainerUser'),
// контейнер, в котором изначально находятся корабли
initialShips = getElement('#ShipPlace');
// нажатие на левую кнопку мышки
initialShips.addEventListener('mousedown', this.onMouseDown.bind(this));
// перемещение мышки с нажатой кнопкой
document.addEventListener('mousemove', this.onMouseMove.bind(this));
// отпускание левой кнопки мышки
document.addEventListener('mouseup', this.onMouseUp.bind(this));
}

Instance.prototype.onMouseDown = function(e) {
	// если нажатие не на левую кнопку или игра запущена
	//  прекращаем работу функции
	if (e.which != 1 || userfield.startGame) return;
	// ищем корабль, ближайший к координатам нажатия на кнопку
	var el = e.target.closest('.ship');
	// если корабль не найден, прекращаем работу функции
	if (!el) return ;
	// выставляем флаг нажатия на левую кнопку мышки
	this.pressed = true;
 
	// запоминаем переносимый объект и его свойства
	this.draggable = {
		elem:	el,
		//запоминаем координаты, с которых начат перенос
		downX:	e.pageX,
		downY:	e.pageY,
		kx:		0,
		ky:		1
	};


	if (el.parentElement.getAttribute('id') == 'ContainerUser') {
		// получаем имя корабля и вызываем функцию, определяющую направление
		// его положения
		var name = el.getAttribute('id');
		this.getDirectionShip(name);
 
		// получаем значения смещения корабля относительно игрового поля и
		// записываем эти значения в объект draggable
		// используя метод slice, убираем единицы измерения (px) смещения
		var computedStyle	= getComputedStyle(el);
		this.draggable.left	= computedStyle.left.slice(0, -2);
		this.draggable.top	= computedStyle.top.slice(0, -2);
 
		// удаляем экземпляр корабля
		this.cleanShip(el);
	}


	return false;
}

Instance.prototype.cleanClone = function() {
	delete this.clone;
	delete this.draggable;
}

Instance.prototype.onMouseMove = function(e) {
	if (this.pressed == false || !this.draggable.elem) return;

	var coords;

	// посчитать дистанцию, на которую переместился курсор мыши
	/*var moveX = e.pageX - this.draggable.downX,
		moveY = e.pageY - this.draggable.downY;
	if (Math.abs(moveX) < 3 && Math.abs(moveY) < 3) return;*/

	if (!this.clone) {
		// используем отдельную функцию для создания клона
		this.clone = this.creatClone(e);
		// еслине удалось создать clone
		if (!this.clone) return;
		
		// получаем координаты клона
		coords = getCoords(this.clone);
		// вычисляем сдвиг курсора по координатам X и Y
		this.shiftX = this.draggable.downX - coords.left;
		this.shiftY = this.draggable.downY - coords.top;
		// перемещаем клон в BODY
		document.body.appendChild(this.clone);
		// задаём стили для возможности позиционирования клона
		// относительно документа
		this.clone.style.zIndex = '1000';
		// получаем количество палуб у перемещаемого корабля
		this.decks = this.getCountDecks();
	}

		// координаты сторон аватара по оси X
	var currLeft	= e.pageX - this.shiftX,
		// координаты сторон аватара по оси Y
		currTop		= e.pageY - this.shiftY;
		

	// присваиваем клону новые координаты абсолютного позиционирования относительно BODY
	this.clone.style.left = currLeft + 'px';
	this.clone.style.top = currTop + 'px';

	coords = getCoords(this.clone);
		// координата нижней стороны
	var currBtm		= coords.bottom,
		// координата правой стороны
		currRight	= coords.right;
	if (currLeft >= user.fieldY - 14 && currRight <= user.fieldRight + 14 && currTop >= user.fieldX - 14 && currBtm <= user.fieldBtm + 14) {
		// получаем координаты привязанные в сетке поля и в координатах матрицы
		var	coords = this.getCoordsClone(this.decks);
		// проверяем валидность установленных координат
		var result = user.checkLocationShip(coords.x, coords.y, this.draggable.kx, this.draggable.ky, this.decks);

		if (result) {
			// клон находится в пределах игрового поля, поэтому
			// подсвечиваем его контур зелёным цветом
			this.clone.classList.remove('unsuccess');
			this.clone.classList.add('success');
		} else {
			// в соседних клетках находятся ранее установленные корабли,
			// поэтому контур клона подсвечен красным цветом
			this.clone.classList.remove('success');
			this.clone.classList.add('unsuccess');
		}
	} else {
		// клон за пределами игрового поля, поэтому его контур
		// подсвечен красным цветом
		this.clone.classList.remove('success');
		this.clone.classList.add('unsuccess');
	}
	return false;
}

Instance.prototype.getCountDecks = function() {
	// получаем тип корабля
	var type = this.clone.getAttribute('id').slice(-1);
	return type
}

Instance.prototype.creatClone = function(e) {
	// создаём клон корабля
	var clone = this.draggable.elem;
		// запоминаем исходное положение перетаскиваемого корабля
		// и его родительский элемент
	var old	= {
			parent:			clone.parentNode,
			nextSibling:	clone.nextSibling,
			left:			clone.style.left || '',
			top:			clone.style.top || '',
			zIndex:			clone.zIndex || ''
		};
	// после создания клона, добавляем ему метод 'rollback', который
	// в случае неудачного переноса, возвращает корабль на исходную позицию,
	// присваивая клону ранее запомненные стили
	clone.rollback = function() {
		old.parent.insertBefore(clone, old.nextSibling);
		clone.style.left = old.left;
		clone.style.top = old.top;
		clone.style.zIndex = old.zIndex;
	};
	return clone;
}

Instance.prototype.getCoordsClone = function(decks) {
    // получаем значения всех координат клона
var pos		= this.clone.getBoundingClientRect(),
    // вычисляем разность между координатой стороны клона и
    // координатой соответствующей стороны игрового поля
    left	= pos.left - user.fieldY,
    right	= pos.right - user.fieldY,
    top		= pos.top - user.fieldX,
    bottom	= pos.bottom - user.fieldX,
    // создаём объект, куда поместим итоговые значения
    coords	= {};

// в результате выполнения условия, убираем неточности позиционирования
coords.top	= (top < 0) ? 0 : (bottom > user.fieldSide) ? user.fieldSide - user.shipSide : top;
coords.top	= Math.round(coords.top / user.shipSide) * user.shipSide;
// получаем значение в координатах матрицы по оси X
coords.x	= coords.top / user.shipSide;

coords.left = (left < 0) ? 0 : (right > user.fieldSide) ? user.fieldSide - user.shipSide * decks : left;
coords.left = Math.round(coords.left / user.shipSide) * user.shipSide;
coords.y	= coords.left / user.shipSide;
return coords;
}

Instance.prototype.onMouseUp = function(e) {
	// сбрасываем флаг нажатия на левую кнопку мыши
	this.pressed = false;
	// если перетаскиваемого объекта не существует, выходим из обработчика событий
	if (!this.clone) return;
 
	// попытка поставить корабль вне игрового поля или в нарушении правил
	if (this.clone.classList.contains('unsuccess')) {
		// удаляем класс подсвечивающий контур корабля красным цветом
		this.clone.classList.remove('unsuccess');
		// возвращаем корабль в исходную позицию из которой было начато перемещение
		this.clone.rollback();
		// проверяем наличие значений атрибута style, если значения существуют, то
		// в данный момент происходит редактирование положения корабля
		if (this.draggable.left !== undefined && this.draggable.top !== undefined) {
			// возвращаем корабль на позицию определённую значениями 'left' и 'top',
			// которые были сохранены в объекте 'draggable'
			this.draggable.elem.style.cssText = 'left:' + this.draggable.left + 'px; top:' + this.draggable.top + 'px;';
		}
	} else {
		// получаем координаты привязанные в сетке поля и в координатах матрицы
		var	coords = this.getCoordsClone(this.decks);
		// переносим клон внутрь игрового поля
		user.field.appendChild(this.clone);
		// прописываем координаты клона относительно игрового поля
		this.clone.style.left = coords.left + 'px';
		this.clone.style.top = coords.top + 'px';
		// создаём объект со свойствами корабля
		var	fc = {
				'shipname': this.clone.getAttribute('id'),
				'x': coords.x,
				'y': coords.y,
				'kx': this.draggable.kx,
				'ky': this.draggable.ky,
				'decks': this.decks
			},
			// создаём экземпляр корабля
			ship = new Ships(user, fc);
			console.log(fc);
		ship.createShip();
		// удаляем z-index, т.к. нет необходимости, чтобы корабль был
		// поверх ВСЕХ элементов
		getElement('#' + ship.shipname).style.zIndex = null;
		// теперь в игровом поле находится сам корабль, поэтому его клон удаляем
		getElement('#ContainerUser').removeChild(this.clone);
	}
 
	// удаляем объекты 'clone' и 'draggable'
	this.cleanClone();
	return false;
}

function getCoords(el) {
	// получаем объект с координатами всех сторон элемента
	// относительно окна браузера
	var coords = el.getBoundingClientRect();
	// пересчитаем координаты относительно документа, для этого
	// добавим величину прокрутки документа по верикали и горизонтали
	// Если вы расположили игровые поля в верхней части страницы и уверенны,
	// что для их отображения прокручивать страницу не потребуется, то
	// полученные координаты можно не преобразовывать
	return {
		left:	coords.left + window.pageXOffset,
		right:	coords.right + window.pageXOffset,
		top:	coords.top + window.pageYOffset,
		bottom: coords.bottom + window.pageYOffset
	};
}

Instance.prototype.getDirectionShip = function(shipname) {
	var data;
	// обходим массив с данными кораблей игрока
	for (var i = 0, length = user.squadron.length; i < length; i++) {
		// записываем в переменную информацию по текущему кораблю
		data = user.squadron[i];
		// если имя текущего корабля массива и редактируемого совпадают, то
		// записываем значения kx и ky в объект draggable
		if (data.shipname === shipname) {
			this.draggable.kx = data.kx;
			this.draggable.ky = data.ky;
			return;
		}
	}
}

instance.setObserver();

