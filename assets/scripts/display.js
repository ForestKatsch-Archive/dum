
var INVERSE=0;

var display={
    context:null,
    content:[

    ],
    dirty:true,
    height:0,
    font_size:[7,10],
    width:0
};

function display_init() {
    display.context=$("#display").get(0).getContext("2d");
    $(window).resize(display_resize);
    display_resize();
    loaded("display");
}

function display_resize() {
    display.width=$(window).width();
    display.height=$(window).height();
    display.context.canvas.width=display.width;
    display.context.canvas.height=display.height;
    display.dirty=true;
}

function display_clear() {
    display.context.fillStyle="#000";
    display.context.fillRect(0,0,display.context.canvas.width,display.context.canvas.height);
}

function setPixel(id,x,y,r,g,b,a) {
    if(x >= id.width)
	return;
    if(y >= id.height)
	return;
    var index=(x+y*id.width)*4;
    id.data[index+0]=r;
    id.data[index+1]=g;
    id.data[index+2]=b;
    id.data[index+3]=a;
}

function display_glyph(id,glyph) {
    var g=FONT[glyph[0]]
    if(!(glyph[0] in FONT))
	g=FONT["undefined"]
    for(var y=0;y<g.length;y++) {
	var col=g[y];
	for(var x=0;x<col.length;x++) {
	    var mul=1;
	    var x_pixel=(x+(glyph[1]*display.font_size[0]))*mul+mul;
	    var y_pixel=(y+(glyph[2]*display.font_size[1]))*mul+mul;
	    if(col[x] != " ")
		setPixel(id,x_pixel,y_pixel,255,255,255,255);
	}
    }
}

function display_draw() {
    var id=display.context.createImageData(display.width,display.height);
    for(var i=0;i<display.content.length;i++) {
	display_glyph(id,display.content[i]);
    }
    display.context.putImageData(id,0,0);
}

function display_redraw() {
    display_clear();
    display_draw();
//    display.dirty=false;
}

function display_update() {
    if(display.dirty)
	display_redraw();
}