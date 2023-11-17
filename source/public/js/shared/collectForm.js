function getFormData(form) {
    var elements = form.elements;
    var obj = {};
    for (var i = 0; i < elements.length; i++) {
        var item = elements.item(i);
        if (item.name) {
            obj[item.name] = item.value;
        }
    }
    return obj;
};