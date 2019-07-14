const films = [
{
title: 'The Green Mile',
creationYear: 1999,
country: ['USA'],
budget: '$60 000 000',
actors: [
{
name: 'Tom Hanks',
age: 63,
role: 'Paul Edgecomb',
},
{
name: 'David Morse',
age: 65,
role: 'Brutus Howell',
},
{
name: 'Michael Clarke Duncan',
age: 54,
role: 'John Coffey',
},
],
director: {
name: 'Frank Darabont',
age: 60,
oscarsCount: 0,
}
},
{
title: 'Inception',
creationYear: 2010,
country: ['USA'],
budget: '$160 000 000',
actors: [
{
name: 'Leonardo DiCaprio',
age: 44,
role: 'Cobb',
},
{
name: 'Joseph Gordon-Levitt',
age: 38,
role: 'Arthur',
},
{
name: 'Ellen Page',
age: 32,
role: 'Ariadne',
},
{
name: 'Tom Hardy',
age: 41,
role: 'Eames',
},
],
director: {
name: 'Christopher Nolan',
age: 48,
oscarsCount: 0,
}
},
{
title: 'Forrest Gump',
creationYear: 1994,
country: ['USA'],
budget: '$55 000 000',
actors: [
{
name: 'Tom Hanks',
age: 63,
role: 'Forrest Gump',
},
{
name: 'Robin Wright',
age: 53,
role: 'Jenny Curran',
},
{
name: 'Sally Field',
age: 72,
role: 'Mrs. Gump',
},
],
director: {
name: 'Robert Zemeckis',
age: 68,
oscarsCount: 1,
}
},
{
title: 'Interstellar',
creationYear: 2014,
budget: '$165 000 000',
country: ['USA','Great Britain', 'Canada'],
actors: [
{
name: 'Matthew McConaughey',
age: 49,
role: 'Cooper',
},
{
name: 'Anne Hathaway',
age: 36,
role: 'Brand',
},
{
name: 'Jessica Chastain',
age: 42,
role: 'Murph',
},
{
name: 'Michael Caine',
age: 86,
role: 'Professor Brand',
},
{
name: 'Matt Damon',
age: 48,
role: 'Mann',
},
],
director: {
name: 'Christopher Nolan',
age: 48,
oscarsCount: 0,
}
},
{
title: 'Catch Me If You Can',
creationYear: 2002,
budget: '$52 000 000',
country: ['USA', 'Canada'],
actors: [
{
name: 'Tom Hanks',
age: 63,
role: 'Carl Hanratty',
},
{
name: 'Leonardo DiCaprio',
age: 36,
role: 'Frank Abagnale Jr.',
},
{
name: 'Christopher Walken',
age: 76,
role: 'Frank Abagnale',
},
{
name: 'Amy Adams',
age: 44,
role: 'Brenda Strong',
},
],
director: {
name: 'Steven Spielberg',
age: 72,
oscarsCount: 4,
}
},
];

let count = sumAges = j = budget = 0, names = [];

for(let i = 0; i < films.length; i++){
if(films[i].director.oscarsCount == 0){
for(j = 0; j < films[i].actors.length; j++){
sumAges += films[i].actors[j].age;
}
count += j;
}

if(films[i].creationYear > 1995){
for(let k = 0; k < films[i].actors.length; k++){
if(films[i].actors[k].name == 'Tom Hanks'){
for(let h = 0; h < films[i].actors.length; h++){
if(films[i].actors[h].name != 'Tom Hanks')
names.push(films[i].actors[h].name);
}
}
}
}

let played = false;
if(films[i].director.age < 70){
for(let k = 0; k < films[i].actors.length; k++){
if(films[i].actors[k].name == 'Tom Hanks'){
played = true;
}
}
if(!played){
let budStr = films[i].budget.substring(1);
budStr = budStr.split(" ").join('');
budget += parseInt(budStr);
}
}
}

alert('Средний возраст актёров: ' + Math.round(sumAges / count) + ' лет');
alert(names.join(", "));
alert('$'+budget);