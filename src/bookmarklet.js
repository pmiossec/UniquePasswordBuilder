(function(upb) {

    form = document.createElement("form");
    form.setAttribute('style', 'position:absolute;top:10px;right:10px;border:1px solid black;padding:10px 10px 8px 10px;background-color:white;font-size:12px;z-index:10000000;');
    input = document.createElement("input");
    input.id = 'uniquePasswordBuilderPassword';
    input.setAttribute('type', 'password');
    input.setAttribute('style', 'border:1px solid black;');
    label = document.createElement("label");
    label.setAttribute("for", "uniquePasswordBuilderPassword");
    label.textContent = "Master password : "
    label.setAttribute('style', 'display:inline-block;');

    form.appendChild(label);
    form.appendChild(input);
    document.body.appendChild(form);

    var passwordEntered = function(e) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        upb.generate(window.location, window.uniquePasswordBuilderRounds, input.value, window.uniquePasswordBuilderKeyIndex, function(generatedPassword) {
            upb.insertGenerateActions(generatedPassword);
            input.remove();
            label.remove();
            form.remove();
        });
    }

    if (form.addEventListener) {
        form.addEventListener('submit', passwordEntered, false);
    } else if (form.attachEvent) {
        form.attachEvent('onsubmit', passwordEntered);
    }

})(window.UniquePasswordBuilder = window.UniquePasswordBuilder || {});