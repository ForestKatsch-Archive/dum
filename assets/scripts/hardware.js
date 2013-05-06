
function hardware_init() {
    display_init();
    cpu_init();
    loaded("hardware");
}

function hardware_update() {
    cpu_update();
    display_update();
}