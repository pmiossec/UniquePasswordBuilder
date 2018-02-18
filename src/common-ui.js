//UI javascript shared betwween html page and browser addon
var urlInput                      = document.getElementById('url');
var usefulUrl                     = document.getElementById('usefulUrl');
var passwordInput                 = document.getElementById('password');
var passwordIconMemo              = document.getElementById('passwordIconMemo');
var algorithmInput                = document.getElementById('algorithm');
var difficultyScryptInput         = document.getElementById('difficultyScrypt');
var difficultyArgon2Input         = document.getElementById('difficultyArgon2');
var usersaltInput                 = document.getElementById('usersalt');
var hideSensitiveData             = document.getElementById('hideSensitiveData');
var outputField                   = document.getElementById('output');
var copyToClipboardBtn            = document.getElementById('copyToClipboardBtn');
var optionsLink                   = document.querySelector('a.options');
var optionsDiv                    = document.querySelector('div.options');

var updatePasswordField = function(text) {
    setTimeout(function () {
        outputField.textContent = text;
    }, 0);
};

var setErrorMessage = function(message, error) {
    if (error) {
        outputField.classList.add('error');
    } else {
        outputField.classList.remove('error');
    }
    copyToClipboardBtn.classList.add('hidden');
    updatePasswordField(message);
};

var hideData = function() {
    if (hideSensitiveData.checked) {
        passwordIconMemo.classList.add('hidden');
        outputField.classList.add('hide');
    } else {
        outputField.classList.remove('hide');
        UniquePasswordBuilder.displayIcons(passwordInput.value, passwordIconMemo);
    }
};

// Defined here but values set by UI scripts...
var onEnter;

var save = function(key, inputs) {
    try {
        var data = {};
        data[key] = inputs;
        chrome.storage.local.set(data);
    } catch(ex) {
        switch(key) {
            case 'prefs':
                localStorage.algorithm = inputs.algorithm;
                localStorage.difficulty = inputs.difficulty;
                localStorage.difficultyArgon2 = inputs.difficultyArgon2;
                localStorage.usersalt = inputs.usersalt;
                localStorage.hideSensitiveData = inputs.hideSensitiveData;
                localStorage.options = inputs.options;
            default:
                localStorage[key] = JSON.stringify(inputs);
        }
    }
};

var savePrefs = function() {
    save('prefs', {
        'algorithm': algorithmInput.value,
        'difficulty': difficultyScryptInput.value,
        'difficultyArgon2': difficultyArgon2Input.value,
        'usersalt': usersaltInput.value,
        'hideSensitiveData': hideSensitiveData.checked,
        'options': !optionsDiv.classList.contains('hidden')
    });
}

var hydrateUi = function (data) {
    algorithmInput.value = data.algorithm;
    difficultyScryptInput.value = data.difficulty;
    difficultyArgon2Input.value = data.difficultyArgon2;
    usersaltInput.value = data.usersalt;
    hideSensitiveData.checked = data.hideSensitiveData === 'true';
    data.options && optionsDiv.classList.remove('hidden');
    changeAlgorithm();
};

var loadPrefs = function() {
    loadKey('prefs', hydrateUi);
}

var loadKey = function(key, loadCallback) {
    try {
        chrome.storage.local.get(key, function(data) {
            console.log('loaded data', data);
            var loadedData = (key === 'prefs') ? {
                    algorithm: data.prefs.algorithm || UniquePasswordBuilder.SCRYPT,
                    difficulty: data.prefs.difficulty || 8192,
                    difficultyArgon2: data.prefs.difficultyArgon2  || 10,
                    usersalt: data.prefs.usersalt || '',
                    hideSensitiveData: data.prefs.hideSensitiveData === 'true',
                    options: data.prefs.options || false
                } : data[key];
            loadCallback(loadedData);
        });
    } catch(ex) {
        switch(key) {
            case 'prefs':
                loadCallback({
                    algorithm: localStorage.algorithm || UniquePasswordBuilder.SCRYPT,
                    difficulty: localStorage.difficulty || 8192,
                    difficultyArgon2: localStorage.difficultyArgon2  || 10,
                    usersalt: localStorage.usersalt || '',
                    hideSensitiveData: localStorage.hideSensitiveData === 'true',
                    options: localStorage.options || false
                })
            default:
                var data = localStorage[key];
                if(data) {
                    loadCallback(JSON.parse(data));
                }
        }
    }
}

var verifyAndComputePassword = function(evt) {
    try {
        outputField.classList.remove('error');
        outputField.classList.remove('hide');

        var password = passwordInput.value;
        var result = UniquePasswordBuilder.verifyPassword(password);
        if (!result.success) {
            passwordIconMemo.classList.add('hidden');
            setErrorMessage(result.message, result.error);
        } else {
            var algorithm = algorithmInput.value;
            var difficultyValue = parseInt(algorithmInput.value === UniquePasswordBuilder.SCRYPT ? difficultyScryptInput.value : difficultyArgon2Input.value, 10);
            var difficulty = (difficultyValue > 0) ? difficultyValue : 1;
            var usersalt = usersaltInput.value && usersaltInput.value != '0' ? usersaltInput.value : '';
            copyToClipboardBtn.classList.remove('hidden');
            hideData();

            var locationSalt = UniquePasswordBuilder.getSaltOnLocation(urlInput.value);
            if(locationSalt === '') {
                usefulUrl.textContent = '';
                setErrorMessage('Please enter an url / key', true);
                return;
            } else {
                usefulUrl.textContent = 'Key used to generate password: ' + locationSalt;
            }

            updatePasswordField("Generating password...");
            UniquePasswordBuilder.generate(algorithm, locationSalt, difficulty, passwordInput.value, usersalt, function(password) {
                updatePasswordField(password);
                savePrefs();
                save('config_' + locationSalt, {
                    'algorithm': algorithm,
                    'difficulty': difficultyScryptInput.value,
                    'difficultyArgon2': difficultyArgon2Input.value,
                    'usersalt': usersaltInput.value
                });

                if (evt && evt.keyCode === 13) {
                    copyToClipboard(null, password);
                    if(onEnter) {
                        onEnter();
                    }
                }
            }, true);
        }
    } catch(e) {
        setErrorMessage(e, true);
    }
};

var timeout = null;
var compute = function(evt) {
    clearTimeout(timeout);
    timeout = setTimeout(verifyAndComputePassword.bind(this, evt), evt && evt.keyCode === 13 ? 0 : 250);
};

var changeAlgorithm = function() {
    difficultyScryptInput.className = algorithmInput.value === UniquePasswordBuilder.SCRYPT ? '' : 'hidden';
    difficultyArgon2Input.className = algorithmInput.value === UniquePasswordBuilder.ARGON2 ? '' : 'hidden';
    compute();
};

var toggleOptions = function(e) {
    e.preventDefault();
    optionsDiv.classList.toggle('hidden');
};

var copyToClipboard = function(evt, password) {
    copyTextToClipboard(password || outputField.textContent);
};

var copyTextToClipboard = function(value) {
    var hiddenInputToCopy = document.createElement("input");
    document.body.appendChild(hiddenInputToCopy);
    hiddenInputToCopy.value = value;
    hiddenInputToCopy.select();
    document.execCommand("copy");
    hiddenInputToCopy.remove();
    return false;
};

var urlChanged = function() {
    var locationSalt = UniquePasswordBuilder.getSaltOnLocation(urlInput.value);
    loadKey('config_' + locationSalt, function(data) {
        if(data) {
            hydrateUi(data);
        }
        compute();
    })
}

algorithmInput.addEventListener('change', changeAlgorithm, false);
urlInput.addEventListener('keyup', urlChanged, false);
passwordInput.addEventListener('keyup', compute, false);
difficultyScryptInput.addEventListener('change', compute, false);
difficultyArgon2Input.addEventListener('change', compute, false);
usersaltInput.addEventListener('keyup', compute, false);
usersaltInput.addEventListener('change', compute, false);
hideSensitiveData.addEventListener('change', hideData, false);
optionsLink.addEventListener('click', toggleOptions, false);
copyToClipboardBtn.addEventListener('click', copyToClipboard, false);

