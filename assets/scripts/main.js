
function s(i) {
    if(i == 1)
	return "";
    else
	return "s";
}

var VERSION=[0,0,1];

var modules=["main","hardware","display","cpu"];
var module_number=0;
var module_start_time;

function loaded(module) {
    if(!(module in modules))
	throw "ModuleError: nonexistent module '"+module+"'";
    if(modules[module] == true)
	throw "ModuleError: module '"+module+"' was loaded multiple times";
    console.log("Loaded "+module);
    module_number+=1;
    modules[module]=true;
    for(var i in modules) {
	if(modules[i] == false)
	    return;
    }
    done();
}

function init() {
    module_start_time=new Date().getTime();
    var m={};
    for(var i=0;i<modules.length;i++)
	m[modules[i]]=false;
    modules=m;
}

function show_error() {
    $("#loading").addClass("error");
    $("#loading").fadeIn(1000);
}

window.onload=function() {
    init();
    setTimeout(function() {
	hardware_init();
	loaded("main");
    },0);
};

function hide_loading() {
    $("#loading").addClass("hidden");
    $("#loading").fadeOut(1000);
}

function done() {
    var time=new Date().getTime()-module_start_time;
    time=(time/1000).toFixed(3);
    console.log("Loaded "+module_number+" module"+s(module_number)+" in "+time+" second"+s(time))
    update();
    hide_loading();
}

function update() {
    requestAnimationFrame(update);
    hardware_update();
    display_update();
}