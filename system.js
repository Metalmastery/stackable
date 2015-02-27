"use strict";
function extend(dest, source) {
	if (typeof dest !== 'object' || typeof source !== 'object') {
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

function Param(name, options){
	this.min = 0;
	this.max = 10;
	this.type = 'int';
	this.name = name || 'x';
	this.typeCode = 1;

	extend(this, options);

	this.value = this.min;
	if (typeof paramTypes[this.type.toUpperCase()] === 'undefined') {
		this.typeCode = 0;
	} else {
		this.typeCode = paramTypes[this.type.toUpperCase()];
	}
}

Param.prototype.setValue = function(value) {
	if (this.validate(value)) {
		this.value = this.normalizeType(value);
	}
};

Param.prototype.validate = function(newValue) {
	return (newValue < this.min) && (newValue > this.max);
};

Param.prototype.getValue = function() {
	return this.value;
};

Param.prototype.normalizeType = function(val) {
	var actual = val;
	if (this.typeCode === paramTypes.INT) {
		actual = Math.round(val);
	}
	return actual;
};

Param.prototype.getModified = function(effect) {
	var base = this.value,
		actual = base;
	if (effect instanceof Effect) {
		actual = this.normalizeType(base + effect.stat + (base / 100 * effect.percent));
	}
	return Math.min(this.max, Math.max(this.min, actual));
};

function Modifier(options){
	this.name = 'x';
	this.value = 1;
	this.type = 'static';

	extend(this, options);

	if (typeof modTypes[this.type.toUpperCase()] === 'undefined') {
		this.typeCode = 0;
	} else {
		this.typeCode = modTypes[this.type.toUpperCase()];
	}
}

function Effect(stat, percent){
	this.stat = 0;
	this.percent = 0;
	if (!isNaN(stat)) {
		this.stat = stat;
	}
	if (!isNaN(percent)) {
		this.percent = percent;
	}
}

Effect.prototype.add = function(eff) {
	if (eff instanceof Effect) {
		this.stat += eff.stat;
		this.percent += eff.percent;
	}
	return this;
};

function Stack(){
	this.modifiers = [];
}

Stack.prototype.calculate = function(name) {
	var stat = 0,
		percent = 0;
	var modifiersForName = this.modifiers.filter(function (item){
		return item.name === name;
	});

	for (var i = 0; i < modifiersForName.length; i++) {
		var obj = modifiersForName[i];
		if (obj.typeCode === modTypes.STATIC) {
			stat += obj.value;
		}
		if (obj.typeCode === modTypes.PERCENT) {
			percent += obj.value;
		}
	}

	return new Effect(stat, percent);
};

Stack.prototype.removeModifier = function(mod) {
	var position = this.modifiers.indexOf(mod);
	if (position >= 0) {
		this.modifiers.splice(position);
	}
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
	this.stacks = [];
	this.mainStack = new Stack();
}

System.prototype.addParam = function(name, options) {
	this.params[name] = new Param(name, options);
};

System.prototype.removeParam = function(name) {
	if (name in this.params) {
		delete this.params[name];
	}
};

System.prototype.getParamBase = function(name) {
	var value = null,
		param = this.params[name];
	if (typeof param === 'object') {
		value = param.getValue();
	}
};

System.prototype.setParamBase = function(name, value) {
	var param = this.params[name];
	if (typeof param === 'object') {
		param.setValue(value);
	}
};

System.prototype.getBaseValues = function() {
	var base = {};
	for (var key in this.params) {
		if (this.params.hasOwnProperty(key) && this.params[key] instanceof Param) {
			base[key] = this.params[key].getValue();
		}
	}
	return base;
};

System.prototype.getActualValues = function() {
	var actual = {};

	for (var key in this.params) {
		if (this.params.hasOwnProperty(key)) {
			actual[key] = this.getActualValueByName(key);
		}
	}

	return actual;
};

System.prototype.getActualValueByName = function(name) {
	var param,
		stackEffect,
		stack;

	if (!this.params.hasOwnProperty(name)) {
		return null;
	}

	param = this.params[name];
	stackEffect = new Effect();
	stackEffect.add(this.mainStack.calculate(name));

	for (var i = 0, l = this.stacks.length; i < l; i++) {
		stack = this.stacks[i];
		stackEffect.add(stack.calculate(name));
	}

	return param.getModified(stackEffect);
};

System.prototype.removeModifier = function(mod) {
	this.mainStack.removeModifier(mod);
};

System.prototype.addModifier = function(mod) {
	this.mainStack.addModifier(mod);
};

System.prototype.uniqueBase = 0;

System.prototype.getUniqueID = function() {
	this.constructor.prototype.uniqueBase ++;
	return 'id' + Math.floor(this.uniqueBase + Math.random()*0xffffff).toString(16);
};

System.prototype.removeStack = function(stack) {
	var position = this.stacks.indexOf(stack);
	if (position >= 0) {
		this.stacks.splice(position);
	}
};

System.prototype.addStack = function(stack) {
	if ((stack instanceof Stack) && (this.stacks.indexOf(stack) < 0)) {
		this.stacks.push(stack);
	}
};

// todo createRandomModifier (good\bad)
// todo stackable modifiers?
// todo stack length limit and LIFO





var t1 = {name : 'y', value : -3, type : 'percent'};
var t2 = new Modifier({name : 'y', value : 12, type : 'percent'});
var t3 = new Modifier({name : 'y', value : 1, type : 'static'});
var s = new Stack();

var sys = new System();
sys.addParam('x', {min : 0, max : 5});
sys.addParam('y', {min : 3, max : 7, type: 'float'});
sys.addParam('test', {min : 1, type : 'int'});

sys.addModifier(t1);
sys.addModifier(t2);
sys.addModifier(t3);
sys.addModifier(new Modifier({name : 'test', value : -53, type : 'percent'}));
sys.addModifier(new Modifier());

s.addModifier(new Modifier());
s.addModifier({name : 'test', value : 12, type : 'percent'});
s.addModifier(t3);