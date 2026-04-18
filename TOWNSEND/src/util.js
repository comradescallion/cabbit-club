const takenUsernames = ["spiritpops", "xxphangirlxx", "forgotten-midgar", "giles_the_x", "john cool", "1ns4n3_4t_h4rt", "michael", "eclipse-whisper", "miamimike", "thexkillxmasterx9000", "luvin_deth", "thejake777", "likeclockwork", "drowned_grl666", "minixsoda", "ctenosaurvideo", "coda"];

function validateUsername(username) {
    if (takenUsernames.includes(username.toLowerCase())) {
        return { valid: false, message: "Username is already taken." };
    }
    else if (username.includes(' ')) {
        return { valid: false, message: "Username cannot contain spaces." };
    }
    return { valid: true };
}

function checkFirstTimeVisitor() {
    const isNew = localStorage.getItem('townsend-virgin') === 'true' || localStorage.getItem('townsend-virgin') === null;
    if (isNew) {
        localStorage.setItem('townsend-virgin', true);

        showPopup(
            "Abandon all hope, ye who enter here!",
            "Welcome to <b>The Pasta Creependium</b>! Is this your first time here, or are you returning?",
            false,
            2,
            ["I'm new blood!", "I know what I'm doing."],
            [
                () => {
                    hidePopup();
                    showPopup(
                        "Welcome, new blood!",
                        "Before you start, pick out a username for yourself.<br><br><input type='text' id='username-input' class='w-full bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-creepy-red' placeholder='Enter your username here...'>",
                        false,
                        1,
                        ["Submit."],
                        [() => {
                            const username = document.getElementById('username-input').value.trim();
                            if (!username) {
                                document.querySelector('#popup-content p span')?.remove(); // Remove previous error if exists
                                document.querySelector('#popup-content p').insertAdjacentHTML('beforeend', '<span class="text-red-500 mt-2 block">Please enter a valid username.</span>');
                            } else if (username.toLowerCase() === "gaster") {
                                location.reload(); // funny funny
                            } else if (!validateUsername(username).valid) {
                                document.querySelector('#popup-content p span')?.remove(); // Remove previous error if exists
                                document.querySelector('#popup-content p').insertAdjacentHTML('beforeend', `<span class="text-red-500 mt-2 block">${validateUsername(username).message}</span>`);
                            } else {
                                localStorage.setItem('townsend-username', username);
                                localStorage.setItem('townsend-virgin', false);

                                hidePopup();
                                showPopup(
                                    "Welcome, <b>" + username + "</b>!",
                                    `Feel free to explore and create your own stories.<br><br><span class="text-creepy-red italic">just remember what you're here for</span>`,
                                    true,
                                    1,
                                    ["Enter the Creependium"],
                                    [() => {
                                        hidePopup();
                                        window.location.href = "/TOWNSEND/thepastacreependium";
                                    }]
                                );
                            }
                        }]
                    );
                },
                () => {
                    localStorage.setItem('townsend-virgin', false);
                    hidePopup();
                    checkIfHasUsername();
                }
            ]
        );
    }
    else {
        checkIfHasUsername();
    }
}

function checkIfHasUsername() {
    const username = localStorage.getItem('townsend-username');
    if (!username) {
        showPopup(
            "Hold on!",
            "Looks like you're not registered with a username! Enter yours here:<br><br><input type='text' id='username-input' class='w-full bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-creepy-red' placeholder='Enter your username here...'>",
            false,
            1,
            ["Submit."],
            [() => {
                const username = document.getElementById('username-input').value.trim();
                if (!username) {
                    document.querySelector('#popup-content p span')?.remove(); // Remove previous error if exists
                    document.querySelector('#popup-content p').insertAdjacentHTML('beforeend', '<span class="text-red-500 mt-2 block">Please enter a valid username.</span>');
                } else if (username.toLowerCase() === "gaster") {
                    location.reload(); // funny funny
                } else if (!validateUsername(username).valid) {
                    document.querySelector('#popup-content p span')?.remove(); // Remove previous error if exists
                    document.querySelector('#popup-content p').insertAdjacentHTML('beforeend', `<span class="text-red-500 mt-2 block">${validateUsername(username).message}</span>`);
                } else {
                    localStorage.setItem('townsend-username', username);
                    localStorage.setItem('townsend-virgin', false);

                    hidePopup();
                    showPopup(
                        "Welcome back, <b>" + username + "</b>!",
                        `The Pasta Creependium awaits you!<br><br><span class="text-creepy-red italic">dishonesty is frowned upon here.</span>`,
                        true,
                        1,
                        ["Enter the Creependium"],
                        [hidePopup]
                        );
                }
            }]
        );
    }
}

function showPopup(title, content, exitButton = true, buttonAmount = 2, buttonTexts = ["Yes", "No"], buttonActions = [hidePopup, hidePopup]) {
    const popup = document.getElementById('popup');
    const backdrop = document.getElementById('backdrop');
    const popupContent = document.getElementById('popup-content');

    popupContent.innerHTML = `<h2 class="text-xl font-serif text-creepy-red font-bold mb-4">${title}</h2><p class="text-gray-300 font-serif text-lg mb-4">${content}</p>`;
    popup.classList.remove('hidden');
    backdrop.classList.remove('hidden');

    // Close when clicking outside the popup
    backdrop.onclick = () => {
        if (exitButton) {
            popup.classList.add('hidden');
            backdrop.classList.add('hidden');
        }
    };

    // Create centered buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = `flex ${buttonAmount === 1 ? 'justify-center' : 'justify-evenly'} mt-6`;
    if (buttonAmount > 0) {
        buttonActions.forEach((action, index) => {
            const btn = document.createElement('button');
            btn.className = `px-4 py-2 font-bold text-sm ${index === 0 ? 'bg-creepy-red hover:bg-red-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'} border border-gray-700 transition-colors`;
            btn.textContent = buttonTexts[index] || `Button ${index + 1}`;
            btn.onclick = () => {
                action();
            };
            buttonsDiv.appendChild(btn);
        });
        popupContent.appendChild(buttonsDiv);
    }
    
    
    // Close handler
    const popupClose = popup.querySelector('#popup-close');

    popupClose.style.display = exitButton ? 'block' : 'none';

    popupClose.onclick = () => {
        popup.classList.add('hidden');
        backdrop.classList.add('hidden');
    };
}

function hidePopup() {
    document.getElementById('popup').classList.add('hidden');
    document.getElementById('backdrop').classList.add('hidden');
}

function clearStorage() {
    const entries = Object.entries(localStorage);
    const townsendEntries = entries.filter(([key, value]) => key.startsWith('townsend-'));
    townsendEntries.forEach(([key, value]) => localStorage.removeItem(key));
}