function extend(dest, source){
	if (typeof dest != 'object' || typeof source != 'object') {
		return dest;
	}
	for (var prop in source) {
		if (source.hasOwnProperty(prop)) {
			dest[prop] = source [prop];
		}
	}
	return dest;
}

var paramTypes = {
		INT : 1,
		FLOAT : 2
	},
	modTypes = {
		STATIC : 1,
		PERCENT : 2
	};

function Param(options){
	this.min = 0;
	this.max = 10;
	this.type = paramTypes.INT;
	this.name = 'x';

	extend(this, options);

	this.value = this.min;
}

//Param.prototype.normalizeType = function() {
//	if (this.type == paramTypes.INT) {
//		this.value = parseInt(this.value);
//	}
//};

function Modifier(options){
	this.name = 'x';
 	this.value = 1;
	this.type = 'STATIC';

	extend(this, options);

	if (typeof modTypes[this.type] == 'undefined') {
		this.typeCode = 0;
	} else {
		this.typeCode = modTypes[this.type];
	}
}

function Stack(){
    this.modifiers = [];
}

Stack.prototype.calculate = function(name, base) {
	var value = base;
	var modifiersForName = this.modifiers.filter(function (item){
	    return item.name == name;
	});

	for (var i = 0; i < modifiersForName.length; i++) {
		var obj = modifiersForName[i];
		if (obj.typeCode == modTypes.STATIC) {
			value += obj.value;
		}
		if (obj.typeCode == modTypes.PERCENT) {
			value += obj.value / 100 * base;
		}
	}
	return value;
};

Stack.prototype.addModifier = function(mod) {
	var t = mod;
	if (! (mod instanceof Modifier)) {
		t = new Modifier(mod);
	}
	this.modifiers.push(t);
};

function System(){
    this.params = {};
	this.modifiers = {};
}

System.prototype.addParam = function(name, options) {
	this.params[name] = new Param(options);
	this.modifiers[name] = [];
};






var t1 = {name : 'y', value : -3, type : 'PERCENT'};
var t2 = new Modifier({name : 'y', value : 12, type : 'PERCENT'});
var t3 = new Modifier({name : 'y', value : 1, type : 'STATIC'});
var s = new Stack();

s.addModifier(t1);
s.addModifier(t2);
s.addModifier(t3);
s.addModifier(new Modifier());

var stackValue = s.calculate('y', 1);
console.log(stackValue);