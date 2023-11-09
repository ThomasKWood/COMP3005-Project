// this is completely unnecessary but if the user goes to http://localhost:3000/ 
// it loads the home page and then redirect them to http://localhost:3000/home lmao
if (window.location.href === "http://localhost:3000/") {
    // window.location = "/home";
}