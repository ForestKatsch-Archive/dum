
var KDEBUG=0;
var HARDWARE=1;
var KERNEL=2;
var ERROR=3;

var LOG_LUT=["!","H","K","E"];

var LOG_START=new Date().getTime();

var log={
    level:HARDWARE,
    logs:[
    ],
    log:function(l,t) {
	if(this.level <= l)
	    console.log("["+((new Date().getTime()-LOG_START)/1000).toFixed(3)+"]"+LOG_LUT[l]+": "+t);
	this.logs[l].push(t);
    },
    hardware:function(t) {
	this.log(HARDWARE,t);
    },
    js:function(t,c) {
	console.log(c);
	throw "DumJS: "+t;
    },
    kernel:function(t) {
	this.log(KERNEL,t);
    },
    error:function(t) {
	this.log(ERROR,t);
    },
    kdebug:function(t) {
	this.log(KDEBUG,t);
    }
};

for(var i=0;i<LOG_LUT.length;i++)
    log.logs.push([]);