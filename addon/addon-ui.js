const detailsLink         = document.getElementById('details');

save = function() {
    chrome.storage.local.set({
        'prefs': {
            'algorithm': algorithmInput.value,
            'difficulty': difficultyScryptInput.value,
            'difficultyArgon2': difficultyArgon2Input.value,
            'usersalt': usersaltInput.value,
            'hideSensitiveData': hideSensitiveData.checked,
            'passwordWithSpecialChars': passwordWithSpecialChars.checked,
            'passwordWithNumbers': passwordWithNumbers.checked,
            'passwordWithLetters': passwordWithLetters.checked,
            'passwordLength': passwordLength.value,
            'options': !optionsDiv.classList.contains('hidden')
        }
    });
};

function load (data) {
    if (data && data.prefs) {
        algorithmInput.value = data.prefs.algorithm || UniquePasswordBuilder.SCRYPT;
        hideSensitiveData.checked = data.prefs.hideSensitiveData;
        hideData();
        changeAlgorithm();
        difficultyScryptInput.value = data.prefs.difficulty || "8192";
        difficultyArgon2Input.value = data.prefs.difficultyArgon2 || 10;
        usersaltInput.value = data.prefs.usersalt || '';
        passwordWithSpecialChars.checked = data.prefs.passwordWithSpecialChars;
        passwordWithNumbers.checked = data.prefs.passwordWithNumbers;
        passwordWithLetters.checked = data.prefs.passwordWithLetters;
        passwordLength.value = data.prefs.passwordLength;
        data.prefs.options && optionsDiv.classList.remove('hidden');
    } else {
        algorithmInput.value = UniquePasswordBuilder.SCRYPT;
        difficultyScryptInput.value = 8192;
    }
}

var cleanAndClose = function() {
    passwordInput.value = "";
    window.close();
};

onEnter = cleanAndClose;

detailsLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: "https://paulgreg.me/UniquePasswordBuilder/" });
    cleanAndClose();
}, false);

copyToClipboardBtn.addEventListener('click', cleanAndClose, false);

algorithmInput.addEventListener('change', save, false);
difficultyScryptInput.addEventListener('change', save, false);
difficultyArgon2Input.addEventListener('change', save, false);
usersaltInput.addEventListener('keyup', save, false);
usersaltInput.addEventListener('change', save, false);

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get('prefs', (data) => {
        load(data);
        // timeout to mitigate that bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1310019
        setTimeout(() => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                passwordInput.value = "";
                urlInput.value = tabs[0].url || "";
                passwordInput.focus();
                verifyAndComputePassword();
            });
        }, 50)
    });
});


