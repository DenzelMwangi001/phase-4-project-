const API_URL = 'http://localhost:5000';

let swapTargetUserId = null;
let swapSkillId = null;
let allSkills = [];

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (user && token) {
        showMainContent(user);
        fetchSkills();
    } else {
        showAuthForms();
    }

    document.getElementById('profile-btn')?.addEventListener('click', showProfileModal);
    document.getElementById('close-profile')?.addEventListener('click', () => {
        document.getElementById('profile-modal').classList.add('hidden');
    });
    document.getElementById('close-swap-modal')?.addEventListener('click', () => {
        document.getElementById('swap-modal').classList.add('hidden');
        document.getElementById('swap-message').value = '';
    });
    document.getElementById('submit-swap')?.addEventListener('click', sendSwapRequest);
    document.getElementById('search-bar')?.addEventListener('input', filterSkills);
});

function showMainContent(user) {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('navbar').classList.remove('hidden');
    document.getElementById('welcome-user').innerText = `Welcome, ${user.username}`;
}

function showAuthForms() {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('navbar').classList.add('hidden');
    document.getElementById('welcome-user').innerText = '';
}

function signup() {
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('signup-message').innerText = data.message || data.error;
        if (data.user && data.token) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            showMainContent(data.user);
            fetchSkills();
        }
    });
}

function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('login-message').innerText = data.message || data.error;
        if (data.user && data.token) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            showMainContent(data.user);
            fetchSkills();
        }
    });
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    showAuthForms();
}

function fetchSkills() {
    fetch(`${API_URL}/skills`)
        .then(res => res.json())
        .then(skills => {
            allSkills = skills;
            renderSkillList(skills);
        });
}

function renderSkillList(skills) {
    const list = document.getElementById('skill-list');
    list.innerHTML = '';
    const currentUser = JSON.parse(localStorage.getItem('user'));

    skills.forEach(skill => {
        const item = document.createElement('div');
        item.classList.add('skill-card');

        let buttonHTML = '';
        if (skill.user_id !== currentUser.id) {
            buttonHTML = `<button class="request-btn" onclick="openSwapModal(${skill.user_id}, ${skill.id}, '${skill.name}')">Request Swap</button>`;
        }

        item.innerHTML = `
            <h3>${skill.name}</h3>
            <p>${skill.description}</p>
            <small>Posted by User ID: ${skill.user_id}</small>
            ${buttonHTML}
        `;

        list.appendChild(item);
    });
}

function filterSkills() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const filtered = allSkills.filter(skill => skill.name.toLowerCase().includes(query));
    renderSkillList(filtered);
}

function postSkill() {
    const name = document.getElementById('skill-name').value;
    const description = document.getElementById('skill-description').value;
    const token = localStorage.getItem('token');

    if (!token) {
        alert('You must be logged in to post a skill.');
        return;
    }

    fetch(`${API_URL}/skills`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('skill-message').innerText = data.message || data.error;
        if (data.skill) {
            fetchSkills();
            document.getElementById('skill-name').value = '';
            document.getElementById('skill-description').value = '';
        }
    });
}

function showProfileModal() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!user || !token) return;

    document.getElementById('profile-username').innerText = user.username;
    document.getElementById('profile-email').innerText = user.email || '(email hidden)';

    fetch(`${API_URL}/skills`)
        .then(res => res.json())
        .then(allSkills => {
            const userSkills = allSkills.filter(s => s.user_id === user.id);
            const container = document.getElementById('my-skills');
            container.innerHTML = '';

            if (userSkills.length === 0) {
                container.innerHTML = '<p>No skills posted yet.</p>';
            } else {
                userSkills.forEach(skill => {
                    const div = document.createElement('div');
                    div.className = 'skill-card';
                    div.innerHTML = `<h4>${skill.name}</h4><p>${skill.description}</p>`;
                    container.appendChild(div);
                });
            }
        });

    fetch(`${API_URL}/swaps?type=received`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(receivedSwaps => {
        const container = document.getElementById('received-swaps');
        container.innerHTML = '';

        if (receivedSwaps.length === 0) {
            container.innerHTML = '<p>No swap requests received.</p>';
        } else {
            receivedSwaps.forEach(swap => {
                const div = document.createElement('div');
                div.className = 'skill-card';
                div.innerHTML = `
                    <h4>From User ID ${swap.sender_id}</h4>
                    <p>${swap.message}</p>
                    <p>Status: <strong>${swap.status}</strong></p>
                    ${swap.status === 'pending' ? `
                        <button onclick="updateSwapStatus(${swap.id}, 'accepted')">Accept</button>
                        <button onclick="updateSwapStatus(${swap.id}, 'rejected')">Reject</button>
                    ` : ''}
                    ${swap.status === 'accepted' && swap.user_email ? `
                        <p><strong>Connect at:</strong> <a href="mailto:${swap.user_email}">${swap.user_email}</a></p>
                        <p><em>Swap accepted. Reach out to coordinate the skill exchange.</em></p>
                    ` : ''}
                `;
                container.appendChild(div);
            });
        }
    });

    fetch(`${API_URL}/swaps?type=sent`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(sentSwaps => {
        const container = document.getElementById('sent-swaps');
        container.innerHTML = '';

        if (sentSwaps.length === 0) {
            container.innerHTML = '<p>No swap requests sent.</p>';
        } else {
            sentSwaps.forEach(swap => {
                const div = document.createElement('div');
                div.className = 'skill-card';
                div.innerHTML = `
                    <h4>To User ID ${swap.receiver_id}</h4>
                    <p>${swap.message}</p>
                    <p>Status: <strong>${swap.status}</strong></p>
                    ${swap.status === 'accepted' && swap.user_email ? `
                        <p><strong>Connect at:</strong> <a href="mailto:${swap.user_email}">${swap.user_email}</a></p>
                        <p><em>Your swap was accepted! Reach out to get started.</em></p>
                    ` : ''}
                `;
                container.appendChild(div);
            });
        }

        document.getElementById('profile-modal').classList.remove('hidden');
    });
}

function updateSwapStatus(swapId, status) {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_URL}/swaps/${swapId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        showProfileModal();
    })
    .catch(err => {
        console.error('Failed to update swap:', err);
        alert('Something went wrong.');
    });
}

function openSwapModal(receiverId, skillId, skillName) {
    swapTargetUserId = receiverId;
    swapSkillId = skillId;

    document.getElementById('swap-message').value = '';
    document.getElementById('swap-skill-name').innerText = skillName;
    document.getElementById('swap-modal').classList.remove('hidden');
}

function sendSwapRequest() {
    const message = document.getElementById('swap-message').value.trim();
    const token = localStorage.getItem('token');

    if (!message) {
        alert('Please write a message.');
        return;
    }

    fetch(`${API_URL}/swaps`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            receiver_id: swapTargetUserId,
            skill_id: swapSkillId,
            message: message
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        document.getElementById('swap-modal').classList.add('hidden');
        document.getElementById('swap-message').value = '';
    })
    .catch(err => {
        console.error('Swap request failed:', err);
        alert('Something went wrong. Please try again.');
    });
}






