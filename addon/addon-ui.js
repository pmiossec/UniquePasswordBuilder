const detailsLink         = document.getElementById('details');

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

algorithmInput.addEventListener('change', savePrefs, false);
difficultyScryptInput.addEventListener('change', savePrefs, false);
difficultyArgon2Input.addEventListener('change', savePrefs, false);
usersaltInput.addEventListener('keyup', savePrefs, false);
usersaltInput.addEventListener('change', savePrefs, false);

document.addEventListener('DOMContentLoaded', () => {
    loadKey('prefs', (data) => {
        hydrateUi(data);
        // timeout to mitigate that bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1310019
        setTimeout(() => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                passwordInput.value = "";
                urlInput.value = tabs[0].url || "";
                urlChanged();
                passwordInput.focus();
            });
        }, 50)
    });
});


