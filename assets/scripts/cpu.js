
var STACK_UNDERFLOW=0;

var ERR_LUT=["stack underflow"];

var I={
    "__push_int":[0x00],
    "__nop":[0x01],
    "__0branch":[0x02],
    "__copy":[0x03]
};

var MAX_CORE_TIME=10; // in milliseconds

var Core=function(id) {
    this.id=id;
    this.stack=[];
    this.return_pointer=[];
    this.memory=[];
    this.rom=[0x00,0xff,0x03];
    this.next_push=false;
    this.program=[];
    this.position=-1;
    this.start_address=0;
    this.kdebug=function(t) {
	log.kdebug("core #"+this.id+": "+t);
    };
    this.kernel=function(t) {
	log.kernel("core #"+this.id+": "+t);
    };
    this.boot=function() {
	console.log("Starting core "+this.id)
	this.program=this.rom;
	this.run(0);
    };
    this.push=function(n) {
	this.kdebug("push 0x"+n.toString(16));
	this.stack.push(n);
    };
    this.error=function(error_code) {
	log.error("core #"+this.id+": "+ERR_LUT[error_code]);
	this.program=[]; // eventually search for proper error
	this.position=-1;
	throw "DumError: "+ERR_LUT[error_code];
    };
    this.pop=function() {
	if(this.stack.length <= 0) {
	    this.error(STACK_UNDERFLOW);
	    return;
	}
	var n=this.stack.pop();
	this.kdebug("pop 0x"+n.toString(16));
	return(n);
    };
    this.run=function(l) {
	this.position=l;
	this.return_pointer.push(l);
    };
    this.get_instruction=function(ins) {
	return(0xff & ins);
    };
    // this.get_arg=function(ins) {
    // 	return (0xfffffff & (ins>>8));
    // };
    this.run_builtin=function(ins) {
	i=this.get_instruction(ins);
	if(i == I["__nop"]) {
	    return;
	} else if(i == I["__copy"]) {
	    var to=this.pop();
	    var from=this.pop();
	    console.log(from,to);
	} else if(i == I["__push_int"]) {
	    this.next_push=true;
	}
    };
    this.run_instruction=function(l) {
	try {
	    var i=this.program[l];
	    if(this.next_push == true) {
		this.push(i);
		this.next_push=false;
	    } else {
		this.run_builtin(i);
	    }
	} catch(e) {
	    if(!e.startsWith("DumError"))
		throw e;
	}
    };
    this.run_next=function() {
	if(this.position == -1)
	    return;
	var start_time=new Date().getTime();
	while(true) {
	    if((this.run_instruction(this.position) == false) || (this.position >= this.program.length-1)) {
		this.position=-1;
		this.kernel("waiting");
		return;
	    }
	    this.position+=1;
	    if((new Date().getTime()-start_time) >= MAX_CORE_TIME)
		break;
	}
    };
};

var cores=[];

var CORE_NUMBER=1;

function cpu_init() {
    for(var i=0;i<CORE_NUMBER;i++) {
	var core=new Core(i);
	core.boot();
	cores.push(core);
    }
    loaded("cpu");
}

function cpu_update() {
    for(var i=0;i<cores.length;i++) {
	cores[i].run_next();
    }
}