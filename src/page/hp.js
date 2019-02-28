(function() {
    // Init location
    var displayInfosLink              = document.getElementById('displayInfos')
    var infosDiv                      = document.getElementById('infos')

    var displayInfos = function(e) {
        if(e) e.preventDefault()
        infosDiv.classList.remove('hidden')
        displayInfosLink.classList.add('hidden')
    }

    if (window.location.hash.indexOf('pwa') !== -1) {
        infosDiv.classList.add('hidden')
        displayInfosLink.classList.remove('hidden')
    } else{
        displayInfos()
    }

    var load = function() {
        algorithmInput.value = localStorage.algorithm || UniquePasswordBuilder.SCRYPT
        difficultyScryptInput.value = localStorage.difficulty || 8192
        hideSensitiveData.checked = localStorage.hideSensitiveData === 'true'
        hideData()
        if (localStorage.difficultyArgon2) difficultyArgon2Input.value = localStorage.difficultyArgon2 | 10
        if (localStorage.usersalt) usersaltInput.value = localStorage.usersalt
        if (localStorage.options === 'true') optionsDiv.classList.remove('hidden')
        if (localStorage.passwordWithSpecialChars === 'false') toggleButton(passwordWithSpecialChars)
        if (localStorage.passwordWithNumbers === 'false') toggleButton(passwordWithNumbers)
        if (localStorage.passwordWithLetters === 'false') toggleButton(passwordWithLetters)
        if (localStorage.passwordLength) passwordLength.value = localStorage.passwordLength || 16
        changeAlgorithm()
        renderDomains()
    }

    save = function() {
        localStorage.algorithm = algorithmInput.value
        localStorage.difficulty = difficultyScryptInput.value
        localStorage.difficultyArgon2 = difficultyArgon2Input.value
        localStorage.usersalt = usersaltInput.value
        localStorage.hideSensitiveData = hideSensitiveData.checked
        localStorage.passwordWithSpecialChars = isChecked(passwordWithSpecialChars)
        localStorage.passwordWithNumbers = isChecked(passwordWithNumbers)
        localStorage.passwordWithLetters = isChecked(passwordWithLetters)
        localStorage.passwordLength = passwordLength.value
        localStorage.options = !optionsDiv.classList.contains('hidden')
    }

    var copyBookmarkletToClipboard = function() {
        var algorithmParameters = (algorithmInput.value === 'argon2')
            ? "window.uniquePasswordBuilderAlgorithm='argon2';window.uniquePasswordBuilderDifficulty='" + difficultyArgon2Input.value + "';window.salt='"+usersaltInput.value +"';window.argon2AsmPath='"+ window.location.href + "';"
            : "window.uniquePasswordBuilderAlgorithm='scrypt';window.uniquePasswordBuilderDifficulty='" + difficultyScryptInput.value + "';window.uniquePasswordBuilderKeyIndex='" + usersaltInput.value + "';"
        var bookmarklet = "javascript:(function(){" + algorithmParameters + "document.body.appendChild(document.createElement('script')).src='"+ window.location.href +"upb.min.js';})();"
        copyTextToClipboard(bookmarklet)
    }

    displayInfosLink.addEventListener('click', displayInfos, false)
    document.getElementById('copyBookmarkletToClipboard').addEventListener('click', copyBookmarkletToClipboard, false)

    algorithmInput.addEventListener('change', saveCurrentDomain, false);
    urlInput.addEventListener('change', saveCurrentDomain, false);
    difficultyScryptInput.addEventListener('change', saveCurrentDomain, false);
    difficultyArgon2Input.addEventListener('change', saveCurrentDomain, false);
    usersaltInput.addEventListener('change', saveCurrentDomain, false);
    passwordWithNumbers.addEventListener('click', saveCurrentDomain, false);
    passwordWithLetters.addEventListener('click', saveCurrentDomain, false);
    passwordWithSpecialChars.addEventListener('click', saveCurrentDomain, false);
    passwordLength.addEventListener('change', saveCurrentDomain, false);
    decreaseLength.addEventListener('click', saveCurrentDomain, false);
    increaseLength.addEventListener('click', saveCurrentDomain, false);
    copyToClipboardBtn.addEventListener('click', saveCurrentDomain, false);

    var domainRegex = /^https?:\/\/(?:[^\/?]+)/i

    function saveCurrentDomain () {
        if (url.value) {
            var domainUrl = url.value;
            if (domainRegex.test(url.value)) {
                domainUrl = domainRegex.exec(url.value)[0]
            }
            saveDomain({url: domainUrl, settings: {
                    algorithmInput: algorithmInput.value,
                    difficulty: difficultyScryptInput.value,
                    difficultyArgon2: difficultyArgon2Input.value,
                    usersalt: usersaltInput.value,
                    hideSensitiveData: hideSensitiveData.checked,
                    passwordWithNumbers: isChecked(passwordWithNumbers),
                    passwordWithLetters: isChecked(passwordWithLetters),
                    passwordWithSpecialChars: isChecked(passwordWithSpecialChars),
                    passwordLength: passwordLength.value
            }})
            renderDomains()
        }
    }

    function getDomains () {
        var domains = localStorage.domains
        return domains = domains ? JSON.parse(domains) : []
    }

    function moveOnTop (arr, idx) {
        return move(arr, idx, 0)
    }
    function move(arr, oldIndex, newIndex) {
        if (newIndex >= arr.length) {
            var k = newIndex - arr.length + 1
            while (k--) arr.push(undefined)
        }
        arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
        return arr
    };

    function saveDomain(domain) {
        var domains = getDomains()
        var idx = domains.map(function(d) { return d.url; }).indexOf(domain.url)
        if (idx !== -1) {
            moveOnTop(domains, idx)
            domains[0] = domain
        } else {
            domains.unshift(domain)
        }
        localStorage.domains = JSON.stringify(domains)
    }

    function empty(list) {
        while (list.firstChild) {
            list.removeChild(list.firstChild)
        }
    }

    function selectDomain(domain) {
        url.value = domain.url
        algorithmInput.value = domain.settings.algorithmInput
        difficultyScryptInput.value = domain.settings.difficulty
        difficultyArgon2Input.value = domain.settings.difficultyArgon2
        usersaltInput.value = domain.settings.usersalt
        hideSensitiveData.checked = domain.settings.hideSensitiveData
        if (domain.settings.passwordWithSpecialChars) { checkButton(passwordWithSpecialChars); } else { uncheckButton(passwordWithSpecialChars); }
        if (domain.settings.passwordWithNumbers) { checkButton(passwordWithNumbers); } else { uncheckButton(passwordWithNumbers); }
        if (domain.settings.passwordWithLetters) { checkButton(passwordWithLetters); } else { uncheckButton(passwordWithLetters); }
        passwordLength.value = domain.settings.passwordLength || 16
        saveDomain(domain)
        renderDomains()
        compute()
    }

    function removeDomain(domain) {
        var domains = getDomains()
        var idx = domains.map(function(d) { return d.url; }).indexOf(domain.url)
        domains.splice(idx, 1)
        localStorage.domains = JSON.stringify(domains)
        renderDomains()
    }

    hideSensitiveData.addEventListener('change', renderDomains, false)

    var domainsTitle = document.querySelector('#domainsTitle')
    var list = document.querySelector('#domains')
    function renderDomains () {
        empty(list)
        var domains = getDomains()
        var stop = domains.length === 0 ||hideSensitiveData.checked
        domainsTitle.style.display = stop ? 'none' : 'block'
        if (stop) return

        domains.map(function (domain) {
            if (domain === {}) return
            var li = document.createElement('li')
            var aDomain = document.createElement('a')
            var aRemove = document.createElement('a')
            aDomain.innerText = domain.url
            aDomain.className = 'domain'
            aRemove.innerText = 'remove'
            aRemove.className = 'remove'
            aDomain.addEventListener('click', selectDomain.bind(null, domain), false)
            aRemove.addEventListener('click', removeDomain.bind(null, domain), false)
            li.appendChild(aDomain)
            li.appendChild(aRemove)
            list.appendChild(li)
        })
    }

    load()

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(function() {
            console.log('service worker registration complete')
        }, function(e) {
            console.log('service worker registration failure:', e)
        })
    }
})()
