
var STACK_UNDERFLOW=0;

var ERR_LUT=["stack underflow"];

var M={
    "memory":0x01,
    "rom":0x02,
    "flash":0x03,
    "stack":0x04,
    "return_stack":0x05,
    "program":0x06,
};

var I={
    "__push_int":[0x00],
    "__nop":[0x01],
    "__0branch":[0x02],
    "__copy":[0x03],
    "__reset":[0x04],
    "__pop":[0x05],
    "__run_from":[0x06],
    "__jump_to":[0x07],
    "__jump_back":[0x08],
};

var MAX_CORE_TIME=10; // in milliseconds

var Core=function(id) {
    this.id=id;
    this.stack=[];
    this.return_stack=[];
    this.memory=[];
    this.instructions=0; // instructions run
    this.rom=[
	0x00,
	M["flash"],
	0x00,
	0x00,
	0x06];
    this.next_push=false;
    this.reset_next=false;
    this.program=[];
    this.flash=[0x00,0xdead,
		0x05,
		0x00,0x00,
		0x07
	       ]; // will be the bios
    this.position=-1;
    this.start_address=0;
    this.kdebug=function(t) {
	log.kdebug("core #"+this.id+": "+t);
    };
    this.kernel=function(t) {
	log.kernel("core #"+this.id+": "+t);
    };
    this.boot=function() {
	this.kernel("Starting core "+this.id)
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
	this.return_stack.push(l);
    };
    this.get_instruction=function(ins) {
	return(0xff & ins);
    };
    // this.get_arg=function(ins) {
    // 	return (0xfffffff & (ins>>8));
    // };
    this.loc=function(l) {
	if(l == M["memory"])
	    return this.memory;
	else if(l == M["rom"])
	    return this.rom;
	else if(l == M["flash"])
	    return this.flash;
	else if(l == M["stack"])
	    return this.stack;
	else if(l == M["return_stack"])
	    return this.return_stack;
	else if(l == M["program"])
	    return this.program;
	else
	    log.js("Nonexistent memory location",{"argument":l,"this":this});
    };
    this.loc_set=function(l,v) {
	if(l == M["memory"])
	    this.memory=v;
	else if(l == M["rom"])
	    this.rom=v;
	else if(l == M["flash"])
	    this.flash=v;
	else if(l == M["stack"])
	    this.stack=v;
	else if(l == M["return_stack"])
	    this.return_stack=v;
	else if(l == M["program"])
	    this.program=v;
	else
	    log.js("Nonexistent memory location",{"arguments":[l,v],"this":this});
    };
    this.run_from=function() {
	var start=this.pop();
	var from=this.pop();
	from=this.loc(from);
	this.program=[];
	for(var i=start;i<from.length;i++) {
	    this.program.push(from[i]);
	}
	this.position=-1;
    };
    this.run_builtin=function(ins) {
	i=this.get_instruction(ins);
	if(i == I["__nop"]) {
	    return;
	} else if(i == I["__reset"]) {
	    this.reset_next=true;
	} else if(i == I["__pop"]) {
	    this.pop();
	} else if(i == I["__run_from"]) {
	    this.run_from();
	} else if(i == I["__jump_to"]) {
	    this.return_stack.push(this.position);
	    this.position=this.pop()-1;
	} else if(i == I["__jump_back"]) {
	    this.position=this.return_stack.pop();
	} else if(i == I["__copy"]) {
	    var clear=this.pop();
	    var copy_to=this.pop();
	    var amount=this.pop();
	    var start=this.pop();
	    var to=this.pop();
	    var t=to;
	    var from=this.pop();
	    from=this.loc(from);
	    to=this.loc(to);
	    var i;
	    if(clear == 0x01)
		to=[];
	    if(amount == 0x00)
		amount=Infinity;
	    for(i=start;i<start+amount;i++,copy_to++) {
		if(i >= from.length) {
		    break; // copied all there was
		}
		var x=from[i];
		if(copy_to >= to.length-1)
		    to.push(x)
		else
		    to[copy_to]=x;
	    }
	    this.loc_set(t,to);
	} else if(i == I["__push_int"]) {
	    this.next_push=true;
	}
    };
    this.run_instruction=function(l) {
	this.instructions+=1;
	try {
	    var i=this.program[l];
	    if(this.next_push == true) {
		this.push(i);
		this.next_push=false;
	    } else {
		this.run_builtin(i);
	    }
	} catch(e) {
	    if(e.indexOf("DumError") != 0)
		throw e;
	}
    };
    this.run_next=function() {
	if(this.position == -1)
	    return;
	var start_time=new Date().getTime();
	while(true) {
	    var i=this.run_instruction(this.position);
	    if((i == false) || (this.position >= this.program.length-1)) {
		this.position=-1;
		this.kernel("waiting");
		return;
	    }
	    this.position+=1;
	    if((new Date().getTime()-start_time) >= MAX_CORE_TIME)
		break;
	    var ins_string=this.instructions.toString();
	    display.dirty=true;
	    display.content=[];
	    for(var i=0;i<ins_string.length;i++) {
		display.content.push([ins_string[i],i,0,[]]);
	    }
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