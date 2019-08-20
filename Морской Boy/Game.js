var Controller = (function() {
    // объявляем переменные
    var player, enemy, self, coords, text,
        tm = 0;

    // литеральный объект
    var battle = {
        // инициализация игры
        init: function() {
            self = this;
            // рандомно определяем кто будет стрелять первым: человек или компьютер
            var rnd = Random(1);
            player = (rnd == 0) ? user : comp;
            // определяем, кто будет противником, т.е. чей выстрел следующий
            enemy = (player === user) ? comp : user;

            // массив с координатами выстрелов при рандомном выборе
            comp.shootMatrix = [];
            // массив с координатами выстрелов для AI
            comp.shootMatrixAI = [];
            // массив с координатами вокруг клетки с попаданием
            comp.shootMatrixAround = [];
            // массив координат начала циклов
            comp.startPoints = [
                [ [6,0], [2,0], [0,2], [0,6] ],
                [ [3,0], [7,0], [9,2], [9,6] ]
            ];

            // создаём временный объект корабля 'tempShip' куда будем заносить
            // координаты попаданий, расположение корабля, количество попаданий
            self.resetTempShip();

            // генерируем координаты выстрелов компьютера в соответствии
            // с рассмотренной стратегией и заносим их в массивы
            // shootMatrix и shootMatrixAI
            self.setShootMatrix();

            // первым стреляет человек
            if (player === user) {
                // устанавливаем на игровое поле компьютера обработчики событий
                // регистрируем обработчик выстрела
                compfield.addEventListener('click', self.shoot);
                // регистрируем обработчик визуальной отметки клеток, в которых
                // однозначно не может быть кораблей противника
                compfield.addEventListener('contextmenu', self.setEmptyCell);
                // выводим сообщение о том, что первый выстрел за пользователем
                self.showServiseText('Вы стреляете первым.');
            } else {
                // выводим сообщение о том, что первый выстрел за компьютером
                self.showServiseText('Первым стреляет компьютер.');
                // вызываем функцию выстрела
                setTimeout(function() {
                    return self.shoot();
                }, 1000);
            }
        },

        // обработка выстрела			
        shoot: function(e) {
            // e !== undefined - значит выстрел производит игрок
            // координаты поступают по клику в px и преобразуются в координаты матрицы (coords)
            if (e !== undefined) {
                // если клик сделан не левой кнопкой мыши, прекращаем работу функции
                if (e.which != 1) return false;
                // преобразуем координаты выстрела в координаты матрицы
                coords = self.transformCoordinates(e, enemy);
            } else {
                // получаем координаты для выстрела компьютера
                coords = self.getCoordinatesShot();
            }
            // значение матрицы по полученным координатам
            var val	= enemy.matrix[coords.x][coords.y];
            switch(val) {
                // промах
                case 0:
                    // устанавливаем иконку промаха и записываем промах в матрицу
                    self.showIcons(enemy, coords, 'dot');
                    enemy.matrix[coords.x][coords.y] = 3;

                    // выводим сообщение о промахе в нижней части экрана
                    text = (player === user) ? 'Вы промахнулись. Стреляет компьютер.' : 'Компьютер промахнулся. Ваш выстрел.';
                    self.showServiseText(text);

                    // определяем, чей выстрел следующий
                    player = (player === user) ? comp : user;
                    enemy = (player === user) ? comp : user;

                    if (player == comp) {
                        // снимаем обработчики событий для пользователя
                        compfield.removeEventListener('click', self.shoot);
                        compfield.removeEventListener('contextmenu', self.setEmptyCell);

                        // если в массиве нет координат, сбрасываем объект к исходным значениям
                        if (comp.shootMatrixAround.length == 0) {
                            self.resetTempShip();
                        }

                        // запускаем функцию shoot для выстрела компьютера
                        setTimeout(function() {
                            return self.shoot();
                        }, 1000);
                    } else {
                        // устанавливаем обработчики событий для пользователя
                        compfield.addEventListener('click', self.shoot);
                        compfield.addEventListener('contextmenu', self.setEmptyCell);
                    }
                    break;

                // попадание
                case 1:
                    // записываем в матрицу значение '4', которое соответствует попаданию
                    enemy.matrix[coords.x][coords.y] = 4;
                    // отображаем иконку попадания
                    self.showIcons(enemy, coords, 'red-cross');
                    // выводим сообщение о попадании в нижней части экрана
                    text = (player === user) ? 'Поздравляем! Вы попали. Ваш выстрел.' : 'Компьютер попал в ваш корабль. Выстрел компьютера';
                    self.showServiseText(text);

                    // перебор массива начнём с конца, для получения корректных значений
                    // при возможном удалении его элементов
                    for (var i = enemy.squadron.length - 1; i >= 0; i--) {
                        var warship		= enemy.squadron[i], // вся информация о корабле эскадры
                            arrayDescks	= warship.matrix; // массив с координатами палуб корабля
                        // перебираем координаты палуб корабля
                        for (var j = 0, length = arrayDescks.length; j < length; j++) {
                            // если координаты одной из палуб корабля совпали с координатами выстрела
                            // увеличиванием счётчик попаданий
                            if (arrayDescks[j][0] == coords.x && arrayDescks[j][1] == coords.y) {
                                warship.hits++;

                                // если кол-во попаданий в корабль становится равным кол-ву палуб
                                // считаем этот корабль уничтоженным и удаляем его из эскадры,
                                // но перед этим сохраняем координаты первой палубы удаляемого корабля
                                // понадобятся для отметки клеток по краям корабля
                                if (warship.hits == warship.decks) {
                                    if (player === comp) {
                                        // сохраняем координаты первой палубы
                                        comp.tempShip.x0 = warship.x0;
                                        comp.tempShip.y0 = warship.y0;
                                    }
                                    enemy.squadron.splice(i, 1);
                                }
                                // выходим из цикла, т.к. палуба найдена
                                break;
                            }
                        }
                    }

                    // игра закончена, все корабли эскадры противника уничтожены
                    if (enemy.squadron.length == 0) {
                        text = (player === user) ? 'Поздравляем! Вы выиграли.' : 'К сожалению, вы проиграли.';
                        //text += ' Хотите продолжить игру?';
                        header.innerHTML = text;

                        // победа игрока
                        if (player == user) {
                            // снимаем обработчики событий для пользователя
                            compfield.removeEventListener('click', self.shoot);
                            compfield.removeEventListener('contextmenu', self.setEmptyCell);
                        // победа компьютера
                        } else {
                            // если выиграл комп., показываем оставшиеся корабли компьютера
                            for (var i = 0, length = comp.squadron.length; i < length; i++) {
                                var div			= document.createElement('div'),
                                    dir			= (comp.squadron[i].kx == 1) ? ' vertical' : '',
                                    classname	= comp.squadron[i].shipname.slice(0, -1);

                                div.className = 'ship ' + classname + dir;
                                div.style.cssText = 'left:' + (comp.squadron[i].y0 * comp.shipSide) + 'px; top:' + (comp.squadron[i].x0 * comp.shipSide) + 'px;';
                                comp.field.appendChild(div);
                            }
                        }
                    // бой продолжается
                    } else {
                        // следующий выстрел компьютера
                        if (player === comp) {
                            // увеличиваем счётчик попаданий, равный кол-ву уничтоженных палуб
                            comp.tempShip.totalHits++;
                            // отмечаем клетки, где точно не может стоять корабль
                            var points	= [
                                [coords.x - 1, coords.y - 1],
                                [coords.x - 1, coords.y + 1],
                                [coords.x + 1, coords.y - 1],
                                [coords.x + 1, coords.y + 1]
                            ];
                            self.markEmptyCell(points);

                            // находим максимально количество палуб из оставшихся кораблей
                            var max = self.checkMaxDecks();

                            if (comp.tempShip.totalHits >= max) {
                                // корабль потоплен
                                // помечаем клетки вокруг корабля, как гарантированно пустые
                                if (comp.tempShip.totalHits == 1) { // однопалубный
                                    points = [
                                        // верхняя
                                        [comp.tempShip.x0 - 1, comp.tempShip.y0],
                                        // нижняя
                                        [comp.tempShip.x0 + 1, comp.tempShip.y0],
                                        // левая
                                        [comp.tempShip.x0, comp.tempShip.y0 - 1],
                                        // правая
                                        [comp.tempShip.x0, comp.tempShip.y0 + 1],
                                    ];
                                // многопалубный корабль
                                } else {
                                    // получаем координаты левой (верхней) клетки для многопалубного корабля
                                    var x1 = comp.tempShip.x0 - comp.tempShip.kx,
                                        y1 = comp.tempShip.y0 - comp.tempShip.ky,
                                        // получаем координаты правой или нижней клетки
                                        // для этого к координате первой палубы прибавляем количество палуб
                                        // умноженное на коэффициент, определяющий направление расположения
                                        // палуб корабля
                                        x2 = comp.tempShip.x0 + comp.tempShip.kx * comp.tempShip.totalHits,
                                        y2 = comp.tempShip.y0 + comp.tempShip.ky * comp.tempShip.totalHits;
                                    points = [
                                        [x1, y1],
                                        [x2, y2]
                                    ];
                                }
                                self.markEmptyCell(points);
                                // сбрасываем значения свойств объекта comp.tempShip в исходное состояние;
                                self.resetTempShip();
                            } else {
                                // формируем координаты выстрелов вокруг попадания
                                self.setShootMatrixAround();
                            }

                            // производим новый выстрел
                            setTimeout(function() {
                                return self.shoot();
                            }, 1000);
                        }
                    }
                    break;

                // блокируем выстрел по координатам с заштрихованной иконкой
                case 2:
                    // выводим предупреждение
                    text = 'Снимаем блокировку с этих координат!';
                    self.showServiseText(text);

                    // получаем коллекцию всех объектов маркеров блокированных клеток
                    var icons = enemy.field.querySelectorAll('.shaded-cell');
                    // перебираем полученную коллекцию иконок
                    [].forEach.call(icons, function(el) {
                        // преобразуем относительные координаты иконок в координаты матрицы
                        var x = el.style.top.slice(0, -2) / comp.shipSide,
                            y = el.style.left.slice(0, -2) / comp.shipSide;

                        // сравниваем координаты иконок с координатами клика
                        if (coords.x == x && coords.y == y) {
                            el.parentNode.removeChild(el);
                            enemy.matrix[coords.x][coords.y] = 0;
                        }
                    });
                    break;
                // обстрелянная координата
                case 3:
                case 4:
                    text = 'По этим координатам вы уже стреляли!';
                    self.showServiseText(text);
                    break;
            }
        },

        showIcons: function(enemy, coords, iconClass) {
            // создаём элемент DIV
            var div = document.createElement('div');
            // присваиваем вновь созданному элементу два класса
            // в зависимости от аргумента iconClass, фоновым рисунком у DIV'а будет или точка,
            // или красный крест, или заштрихованная клетка
            div.id = 'icon';
            div.className = iconClass;
            // задаём смещение созданного элемента, при этом преобразуем координаты из матричных
            // в относительные (относительно игрового поля противника)
            // для этого значение координаты в сетке матрицы умножаем на ширину клетки
            // игрового поля, которая, как вы помните равна 33px
            div.style.cssText = 'left:' + (coords.y * enemy.shipSide) + 'px; top:' + (coords.x * enemy.shipSide) + 'px;';
            // устанавливаем созданный элемент в игровом поле противника
            enemy.field.appendChild(div);
        },

        setEmptyCell: function(e) {
            // если клик сделан не правой кнопкой мыши, прекращаем работу функции
            if (e.which != 3) return false;
            // блокируем действие браузера по умолчанию - появление
            // контекстного меню
            e.preventDefault();
            // преобразуем относительные координаты клика в координаты
            // двумерного массива (матрицы игрового поля)
            coords = self.transformCoordinates(e, comp);

            // прежде чем штриховать клетку, необходимо проверить пустая ли клетка
            // если там уже есть маркер блокировки, то удалить его,
            // если попадание или промах, то никаких действий не производим
            var ch = self.checkCell();
            // если в выбранной клетке уже установлена какая-то иконка, то
            // ch = false, в противном случае ch = true
            if (ch) {
                // заштриховываем выбранную клетку
                self.showIcons(enemy, coords, 'shaded-cell');
                // записываем в матрице игрового поля компьютера 2,
                // значение заблокированной клетки
                comp.matrix[coords.x][coords.y] = 2;
            }
        },

        // можно переделать, проверять через значение comp.matrix
        // но в таком случае, придётся преобразовывать координаты матрицы в абсолютные
        // координаты и по ним искать DIV для удаления
        checkCell: function() {
            // получаем коллекцию всех иконок, установленных на игровом поле компьютера
            var icons	= enemy.field.querySelectorAll('.icon-field'),
                flag	= true;

            // перебираем полученную коллекцию иконок
            [].forEach.call(icons, function(el) {
                // преобразуем относительные координаты иконок в координаты матрицы
                var x = el.style.top.slice(0, -2) / comp.shipSide,
                    y = el.style.left.slice(0, -2) / comp.shipSide;

                // сравниваем координаты иконок с координатами клика
                if (coords.x == x && coords.y == y) {
                    // проверяем, какая иконка установлена, используя класс, отвечающий
                    // за вывод заштрихованной иконки класс 'shaded-cell'
                    var isShaded = el.classList.contains('shaded-cell');
                    // если клетка, по которой кликнули, уже заштрихована, то
                    if (isShaded) {
                        // удаляем эту иконку
                        el.parentNode.removeChild(el);
                        // записываем в матрице игрового поля компьютера 0,
                        // значение пустой клетки
                        comp.matrix[coords.x][coords.y] = 0;
                    }
                    flag = false;
                }
            });
            return flag;
        },

        setShootMatrix: function() {
            // заполняем массив shootMatrix
            for (var i = 0; i < 10; i++) {
                for(var j = 0; j < 10; j++) {
                    comp.shootMatrix.push([i, j]);
                }
            }

            // заполняем массив shootMatrixAI
            for (var i = 0, length = comp.startPoints.length; i < length; i++) {
                var arr = comp.startPoints[i];
                for (var j = 0, lh = arr.length; j < lh; j++) {
                    var x = arr[j][0],
                        y = arr[j][1];

                    switch(i) {
                        case 0:
                            while(x <= 9 && y <= 9) {
                                comp.shootMatrixAI.push([x,y]);
                                x = (x <= 9) ? x : 9;
                                y = (y <= 9) ? y : 9;
                                x++; y++;
                            };
                            break;

                        case 1:
                            while(x >= 0 && x <= 9 && y <= 9) {
                                comp.shootMatrixAI.push([x,y]);
                                x = (x >= 0 && x <= 9) ? x : (x < 0) ? 0 : 9;
                                y = (y <= 9) ? y : 9;
                                x--; y++;
                            };
                            break;
                    }
                }
            }

            // премешиваем массив setShootMatrixAI
            function compareRandom(a, b) {
                return Math.random() - 0.5;
            }
            comp.shootMatrix.sort(compareRandom);
            comp.shootMatrixAI.sort(compareRandom);
            return;
        },

        getCoordinatesShot: function() {
            // если ещё есть координаты выстрелов для реализации оптимальной
            // тактики, получаем их, в противном случае
            // берём координаты очередного выстрела из массива shootMatrix
            coords = (comp.shootMatrixAround.length > 0) ? comp.shootMatrixAround.pop() : (comp.shootMatrixAI.length > 0) ? comp.shootMatrixAI.pop() : comp.shootMatrix.pop();

            // заносим полученные координаты в объект
            var obj = {
                x: coords[0],
                y: coords[1]
            };

            // удаляем выбранные координаты из массива shootMatrix
            // для исключения повторного их обстрела в дальнейшем
            if (comp.shootMatrixAI.length != 0) {
                self.deleteElementMatrix(comp.shootMatrixAI, obj);
            }
            self.deleteElementMatrix(comp.shootMatrix, obj);

            return obj;
        },

        setShootMatrixAround: function() {
            // если положение корабля не определено, то вычисляем его используя
            // координаты первого и второго попадания
            if (comp.tempShip.kx == 0 && comp.tempShip.ky == 0) {
                // проверяем, есть ли в объекте 'tempShip.firstHit' координаты, если нет
                // то будем считать, что это первое попадание и запишем
                // в этот объект координаты первого попадания
                if (Object.keys(comp.tempShip.firstHit).length === 0) {
                    comp.tempShip.firstHit = coords;
                } else {
                    // запишем координаты второго попадания в объект 'nextHit'
                    comp.tempShip.nextHit = coords;
                    // вычисляем коэффициенты определяющие положения корабля
                    // разность между соответствующими координатами первого и второго
                    // попадания не может быть больше 1, в противном случае будем
                    // считать, что второе попадание было по другому кораблю
                    comp.tempShip.kx = (Math.abs(comp.tempShip.firstHit.x - comp.tempShip.nextHit.x) == 1) ? 1 : 0;
                    comp.tempShip.ky = (Math.abs(comp.tempShip.firstHit.y - comp.tempShip.nextHit.y) == 1) ? 1 : 0;
                }
            }

            // корабль расположен вертикально
            if (coords.x > 0 && comp.tempShip.ky == 0) comp.shootMatrixAround.push([coords.x - 1, coords.y]);
            if (coords.x < 9 && comp.tempShip.ky == 0) comp.shootMatrixAround.push([coords.x + 1, coords.y]);
            // корабль расположен горизонтально
            if (coords.y > 0 && comp.tempShip.kx == 0) comp.shootMatrixAround.push([coords.x, coords.y - 1]);
            if (coords.y < 9 && comp.tempShip.kx == 0) comp.shootMatrixAround.push([coords.x, coords.y + 1]);

            // получив координаты обстрела попадания, необходимо проверить их валидность
            // координата валидна, если значение массива не равно или 2 (гарантированно пустая
            // клетка), или 3 (промах), или 4 (попадание)
            for (var i = comp.shootMatrixAround.length - 1; i >= 0; i--) {
                // получаем координаты X и Y возможного выстрела
                var x = comp.shootMatrixAround[i][0],
                    y = comp.shootMatrixAround[i][1];
                // проверяем валидность этих координат и если они не валидны - удаляем их из массива
                // координат выстрелов вокруг клетки с попаданием
                if (user.matrix[x][y] !== 0 && user.matrix[x][y] !== 1) {
                    comp.shootMatrixAround.splice(i,1);
                    self.deleteElementMatrix(comp.shootMatrix, coords);
                    // if (comp.shootMatrixAI.length != 0) {
                    // 	self.deleteElementMatrix(comp.shootMatrixAI, coords);
                    // }
                }
            }
            if (comp.shootMatrixAround.length == 0) {
                // считаем корабль потопленным, сбрасываем свойства объекта tempShip
                // в исходные состояния
                self.resetTempShip();
            }

            return;
        },

        deleteElementMatrix: function(array, obj) {
            for (var i = 0, lh = array.length; i < lh; i++) {
                // находим ячейку массива, в которой содержатся координата
                // равная координате выстрела и удаляем эту ячейку
                if (array[i][0] == obj.x && array[i][1] == obj.y) {
                    array.splice(i, 1);
                    break;
                }
            }
        },

        resetTempShip: function() {
            // обнуляем массив с координатами обстрела клеток
            // вокруг попадания
            comp.shootMatrixAround = [];
            comp.tempShip = {
                // количество попаданий в корабль
                totalHits: 0,
                // объекты для хранения координат первого и второго попадания
                // необходимы для вычисления положения корабля
                firstHit: {},
                nextHit: {},
                // значения коэффициентов зависит от положения корабля
                // данные значения используются для вычисления координат
                // обстрела "раненого" корабля
                kx: 0,
                ky: 0
            };
        },

        checkMaxDecks: function() {
            var arr = [];
            for (var i = 0, length = user.squadron.length; i < length; i++) {
                // записываем в массив кол-во палуб у оставшихся кораблей
                arr.push(user.squadron[i].decks);
            }
            // возвращаем max значение
            return Math.max.apply(null, arr);
        },

        markEmptyCell: function(points) {
            var obj;

            // перебираем массив с координатами
            for (var i = 0, lh = points.length ; i < lh ; i++) {
                // записываем координаты в объект
                obj = {
                    x: points[i][0],
                    y: points[i][1]
                };
                // если выполняется хотя бы одно из условий, значит координата находится
                // за пределами игрового поля и она нам не нужна
                // такое возможно, если клетка с попаданием расположена в углу
                // или на краю игрового поля
                // прерываем текущую итерацию и переходим к следующей
                if (obj.x < 0 || obj.x > 9 || obj.y < 0 || obj.y > 9) continue; // за пределами игрового поля

                // песли по данным координатам прописано уже какое-то значение отличное
                // от нуля, значит в этом месте уже стоит отметка или промаха, или попадания,
                // или ранее поставленной пустой клетки
                // прерываем текущую итерацию и переходим к следующей
                if (user.matrix[obj.x][obj.y] != 0) continue;

                // отображаем по данным координатам иконку гарантированно пустой клетки
                self.showIcons(enemy, obj, 'shaded-cell');
                // записываем в двумерный массив игрового поля игрока по данным координатам
                // значение '2', соотвествующее пустой клетке
                user.matrix[obj.x][obj.y] = 2;

                // удаляем из массивов выстрелов данные координаты, чтобы исключить
                // в дальнейшем их обстрел
                self.deleteElementMatrix(comp.shootMatrix, obj);
                if (comp.shootMatrixAround.length != 0) {
                    self.deleteElementMatrix(comp.shootMatrixAround, obj);
                }
                if (comp.shootMatrixAI.length != 0) {
                    self.deleteElementMatrix(comp.shootMatrixAI, obj);
                }
                self.deleteElementMatrix(comp.shootMatrix, obj);
            }
        },

        transformCoordinates: function(e, instance) {
            // полифил для IE
            if (!Math.trunc) {
                Math.trunc = function(v) {
                    v = +v;
                    return (v - v % 1) || (!isFinite(v) || v === 0 ? v : v < 0 ? -0 : 0);
                };
            }

            // создадим объект, в который запишем полученные координаты матрицы
            var obj = {};
            // вычисляем ячейку двумерного массива,которая соответствует
            // координатам выстрела
            obj.x = Math.floor((e.pageY - instance.fieldX + 10) / instance.shipSide) + 9,
            obj.y = Math.floor((e.pageX - instance.fieldY) / instance.shipSide) - 1;
            console.log(obj);
            return obj;
        },

        // вывод сообщений в ходе игры
        showServiseText: function(text) {
            // очищаем шапку от старого сообщения
            header.innerHTML = '';
            // выводим новое сообщение
            // создаём текстовый блок 
            header.innerHTML = text;
        }
    };

    // делаем доступ к инициализации публичным, т.е. доступным снаружи модуля
    return ({
        battle: battle,
        init: battle.init
    });

})();