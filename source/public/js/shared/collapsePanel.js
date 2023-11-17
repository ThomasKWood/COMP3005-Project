// Collapse Panel Functionality
window.onload = function () {
    var rows = document.getElementsByTagName("tr");
    for (var i = 0; i < rows.length; i++) {
        rows[i].addEventListener("click", function () {
            var panel = this.querySelector(".collapse-panel");
            if (panel.style.display === "none") {
                panel.style.display = "block";
            } else {
                panel.style.display = "none";
            }
        });
    }
};