(() => {
    const cfg = window.COUPLE_ZONE_CONFIG || {};
    const $ = id => document.getElementById(id);

    let db, user;
    let mode = 'login';
    let sw = false;
    let currentView = 'home';
    let activeCategory = 'All';
    let currentActivity = null;
    let activities = [];
    let loadError = '';

    const favKey = () => `cz_favs_${user?.id || 'guest'}`;

    const getFavs = () =>
        JSON.parse(localStorage.getItem(favKey()) || '[]');

    const setFavs = items =>
        localStorage.setItem(favKey(), JSON.stringify(items));

    const categoryIcons = {
        'Activities': '🎯',
        'Communication': '💬',
        'Couple Challenges': '🏆',
        'Deep Conversations': '🗣️',
        'Fun Games': '🎲',
        'Future': '🌟',
        'Love & Appreciation': '💕',
        'Memories': '📸',
        'Romance': '❤️'
    };

    const translations = {
        'Activities': 'Shughuli',
        'Communication': 'Mawasiliano',
        'Couple Challenges': 'Changamoto za Wapenzi',
        'Deep Conversations': 'Mazungumzo ya Kina',
        'Fun Games': 'Michezo ya Kufurahisha',
        'Future': 'Mustakabali',
        'Love & Appreciation': 'Upendo na Shukrani',
        'Memories': 'Kumbukumbu',
        'Romance': 'Mapenzi'
    };

    function say(message) {
        $('authMsg').textContent = message;
    }

    function title(a) {
        return sw
            ? (a.title_sw || a.title_en)
            : (a.title_en || a.title_sw);
    }

    function desc(a) {
        return sw
            ? (a.description_sw || a.description_en)
            : (a.description_en || a.description_sw);
    }

    function catName(category) {
        return sw
            ? (translations[category] || category)
            : category;
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[c]);
    }

    function categorize() {
        return [...new Set(
            activities.map(a => a.category).filter(Boolean)
        )].sort().map(category => [
            catName(category),
            categoryIcons[category] || '✨',
            category
        ]);
    }

    async function loadActivities() {
        loadError = '';

        try {
            const { data, error } = await db
                .from('activities')
                .select('*')
                .range(0, 999);

            if (error) {
                throw error;
            }

            activities = (data || []).map((a, i) => ({
                ...a,
                id: a.id || 'db-' + i,
                title_en: a.title_en || a.title || 'Activity',
                title_sw: a.title_sw || a.title_en || a.title || 'Shughuli',
                description_en: a.description_en || a.description || '',
                description_sw: a.description_sw || a.description_en || '',
                category: String(a.category || 'Activities').trim(),
                duration_minutes: a.duration_minutes || 15
            }));

            console.log('Activities loaded:', activities.length);

        } catch (error) {
            loadError = error.message || 'Could not load activities';
            console.error('Activities error:', error);
            activities = [];
        }
    }

    function card(a) {
        const fav = getFavs().includes(String(a.id));

        return `
        <article class="activity-card" data-open="${escapeHtml(a.id)}">
            <div class="activity-top">
                <span>${escapeHtml(catName(a.category))}</span>
                <button class="heart-btn"
                    data-fav="${escapeHtml(a.id)}">
                    ${fav ? '♥' : '♡'}
                </button>
            </div>

            <h3>${escapeHtml(title(a))}</h3>
            <p>${escapeHtml(desc(a))}</p>

            <span class="activity-time">
                ◷ ${a.duration_minutes || 15}
                ${sw ? 'dakika' : 'min'}
            </span>
        </article>`;
    }

    function bindCards(root) {
        root.querySelectorAll('[data-open]').forEach(el => {
            el.onclick = e => {
                if (e.target.closest('[data-fav]')) return;
                openActivity(el.dataset.open);
            };
        });

        root.querySelectorAll('[data-fav]').forEach(btn => {
            btn.onclick = e => {
                e.stopPropagation();
                toggleFav(btn.dataset.fav);
            };
        });
    }

    function renderExplore() {
        const search = $('searchInput').value.trim().toLowerCase();

        const cats = [
            ['All', '✦', 'All'],
            ...categorize()
        ];

        $('exploreCategories').innerHTML = cats.map(c => `
            <button class="chip ${activeCategory === c[2] ? 'active' : ''}"
                data-chip="${escapeHtml(c[2])}">
                ${c[1]} ${sw && c[2] !== 'All' ? c[0] : c[2]}
            </button>
        `).join('');

        $('exploreCategories')
            .querySelectorAll('[data-chip]')
            .forEach(btn => {
                btn.onclick = () => {
                    activeCategory = btn.dataset.chip;
                    renderExplore();
                };
            });

        const filtered = activities.filter(a => {
            const categoryMatches =
                activeCategory === 'All' ||
                String(a.category).trim().toLowerCase() ===
                String(activeCategory).trim().toLowerCase();

            const text = [
                a.title_en,
                a.title_sw,
                a.description_en,
                a.description_sw,
                a.category
            ].join(' ').toLowerCase();

            return categoryMatches && text.includes(search);
        });

        if (loadError) {
            $('exploreActivities').innerHTML =
                `<p class="message">Database error: ${escapeHtml(loadError)}</p>`;
            return;
        }

        $('exploreActivities').innerHTML = filtered.length
            ? filtered.map(card).join('')
            : `<p class="message">${
                sw ? 'Hakuna shughuli zilizopatikana.' : 'No activities found.'
              }</p>`;

        bindCards($('exploreActivities'));
    }

    function renderFavorites() {
        const ids = getFavs();

        const list = activities.filter(a =>
            ids.includes(String(a.id))
        );

        $('favoriteActivities').innerHTML = list.length
            ? list.map(card).join('')
            : `<p class="message">${
                sw ? 'Bado hujahifadhi shughuli.' : 'You have not saved any activities yet.'
              }</p>`;

        bindCards($('favoriteActivities'));
    }

    function renderAll() {
        const cats = categorize();

        $('homeCategories').innerHTML = cats.map(c => `
            <button class="category-card"
                data-category="${escapeHtml(c[2])}">
                <span>${c[1]}</span>
                <b>${escapeHtml(c[0])}</b>
                <small>${sw ? 'Gundua mawazo' : 'Explore ideas'}</small>
            </button>
        `).join('');

        $('homeCategories')
            .querySelectorAll('[data-category]')
            .forEach(btn => {
                btn.onclick = () => {
                    activeCategory = btn.dataset.category;
                    go('explore');
                };
            });

        $('homeActivities').innerHTML =
            activities.slice(0, 3).map(card).join('');

        bindCards($('homeActivities'));

        renderExplore();
        renderFavorites();

        $('welcome').innerHTML = sw
            ? 'Karibuni,<br><em>mjenge ukaribu.</em>'
            : 'Grow closer,<br><em>together.</em>';

        $('surpriseTitle').textContent =
            sw ? 'Mshangao mdogo?' : 'A little surprise?';

        $('surpriseText').textContent =
            sw ? 'Tuchague jambo zuri kwa ajili yenu wawili.'
               : 'Let us choose something lovely for you two.';

        $('surpriseBtn').textContent =
            sw ? 'Tushangaze ↗' : 'Surprise us ↗';

        $('homeExploreTitle').textContent =
            sw ? 'Gundua shughuli' : 'Explore activities';

        $('featuredTitle').textContent =
            sw ? 'Mapendekezo kwenu' : 'Picked for you';

        $('exploreHeading').textContent =
            sw ? 'Gundua' : 'Explore';

        $('exploreSub').textContent =
            sw ? 'Muda mfupi pamoja huleta tofauti kubwa.'
               : 'Small moments can make a big difference.';

        $('favoritesHeading').textContent =
            sw ? 'Vilivyohifadhiwa' : 'Favorites';

        $('favoritesSub').textContent =
            sw ? 'Shughuli mlizohifadhi.'
               : 'Your saved moments, all in one place.';

        $('profileHeading').textContent =
            sw ? 'Wasifu' : 'Profile';

        $('navHome').textContent = sw ? 'Nyumbani' : 'Home';
        $('navExplore').textContent = sw ? 'Gundua' : 'Explore';
        $('navFavorites').textContent = sw ? 'Vipendwa' : 'Favorites';
        $('navProfile').textContent = sw ? 'Wasifu' : 'Profile';

        $('connectTitle').textContent =
            sw ? 'Nafasi yenu ya wawili' : 'Your couple space';

        $('connectHint').textContent =
            sw ? 'Mwalike mwenza wako ajiunge.'
               : 'Invite your partner to join you.';

        $('createInvite').textContent =
            sw ? 'Tengeneza mwaliko' : 'Create invite';

        $('joinInvite').textContent = sw ? 'Jiunge' : 'Join';

        $('joinCode').placeholder =
            sw ? 'Namba ya tarakimu 6' : '6-digit code';
    }

    function setMode(m) {
        mode = m;

        $('loginTab').classList.toggle('active', m === 'login');
        $('signupTab').classList.toggle('active', m === 'signup');
        $('nameWrap').classList.toggle('hidden', m !== 'signup');
        $('adultWrap').classList.toggle('hidden', m !== 'signup');

        $('authSubmit').textContent = m === 'login'
            ? (sw ? 'Ingia' : 'Log in')
            : (sw ? 'Jisajili' : 'Create account');

        say('');
    }

    async function ensureProfile() {
        if (!user) return;

        const { error } = await db.from('profiles').upsert({
            id: user.id,
            display_name: user.user_metadata?.display_name || user.email,
            is_adult: true
        }, { onConflict: 'id' });

        if (error) console.warn(error.message);
    }

    async function refreshCouple() {
        const { data, error } = await db
            .from('couple_members')
            .select('couple_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

        $('coupleStatus').textContent = error
            ? 'Could not load couple connection.'
            : data
                ? 'You are connected to a couple space.'
                : 'You can enjoy Couple Zone without connecting a partner.';
    }

    async function showApp() {
        $('authPanel').classList.add('hidden');
        $('appPanel').classList.remove('hidden');
        $('bottomNav').classList.remove('hidden');

        $('hello').textContent =
            (sw ? 'Karibu, ' : 'Welcome, ') +
            (user.user_metadata?.display_name ||
             user.email?.split('@')[0] || '');

        $('profileName').textContent =
            user.user_metadata?.display_name || 'Couple Zone member';

        $('profileEmail').textContent = user.email || '';

        await refreshCouple();
        await loadActivities();

        renderAll();
        go('home');
    }

    function go(view) {
        currentView = view;

        document.querySelectorAll('.view').forEach(el =>
            el.classList.add('hidden')
        );

        $(view + 'View').classList.remove('hidden');

        document.querySelectorAll('.navitem').forEach(el =>
            el.classList.toggle('selected', el.dataset.view === view)
        );

        if (view === 'favorites') renderFavorites();
        if (view === 'explore') renderExplore();
    }

    function toggleFav(id) {
        let favs = getFavs();

        favs = favs.includes(String(id))
            ? favs.filter(x => x !== String(id))
            : [...favs, String(id)];

        setFavs(favs);
        renderAll();
    }

    function openActivity(id) {
        currentActivity = activities.find(a =>
            String(a.id) === String(id)
        );

        if (!currentActivity) return;

        $('modalCategory').textContent =
            catName(currentActivity.category);

        $('modalTitle').textContent = title(currentActivity);
        $('modalDescription').textContent = desc(currentActivity);

        $('modalDuration').textContent =
            `◷ ${currentActivity.duration_minutes || 15} ${sw ? 'dakika' : 'minutes'}`;

        $('modalFavorite').textContent =
            getFavs().includes(String(id))
                ? '♥ Saved to favorites'
                : '☆ Save to favorites';

        $('activityModal').classList.remove('hidden');
    }

    // Language
    $('langBtn').onclick = () => {
        sw = !sw;
        $('langBtn').textContent = sw ? 'English' : 'Kiswahili';
        setMode(mode);
        renderAll();
    };

    // Login and signup
    $('loginTab').onclick = () => setMode('login');
    $('signupTab').onclick = () => setMode('signup');

    $('authForm').onsubmit = async e => {
        e.preventDefault();

        say(sw ? 'Subiri kidogo…' : 'Please wait…');

        const email = $('email').value.trim();
        const password = $('password').value;

        if (mode === 'signup' && !$('adult').checked) {
            say('Please confirm you are 18 or older.');
            return;
        }

        const result = mode === 'signup'
            ? await db.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: $('displayName').value.trim(),
                        is_adult: true
                    }
                }
            })
            : await db.auth.signInWithPassword({ email, password });

        if (result.error) {
            say(result.error.message);
            return;
        }

        if (mode === 'signup' && !result.data.session) {
            say('Account created. Confirm your email if required, then log in.');
            return;
        }

        user = result.data.user;

        await ensureProfile();
        await showApp();
    };

    // Search
    $('searchInput').oninput = renderExplore;

    // Navigation
    document.querySelectorAll('.navitem').forEach(btn => {
        btn.onclick = () => go(btn.dataset.view);
    });

    document.querySelectorAll('[data-go]').forEach(btn => {
        btn.onclick = () => go(btn.dataset.go);
    });

    // Activity modal
    $('modalFavorite').onclick = () => {
        if (currentActivity) {
            toggleFav(currentActivity.id);
            openActivity(currentActivity.id);
        }
    };

    $('closeModal').onclick = () =>
        $('activityModal').classList.add('hidden');

    $('activityModal').onclick = e => {
        if (e.target.id === 'activityModal') {
            $('activityModal').classList.add('hidden');
        }
    };

    // Surprise activity
    $('surpriseBtn').onclick = () => {
        if (!activities.length) return;

        const a = activities[
            Math.floor(Math.random() * activities.length)
        ];

        openActivity(a.id);
    };

    // Couple invitation
    $('createInvite').onclick = async () => {
        const btn = $('createInvite');
        btn.disabled = true;

        $('inviteResult').textContent = 'Creating...';

        const { data, error } =
            await db.rpc('create_couple_invite');

        btn.disabled = false;

        $('inviteResult').textContent =
            error ? error.message : data;
    };

    $('joinInvite').onclick = async () => {
        const code = $('joinCode').value.trim();

        if (!/^\d{6}$/.test(code)) {
            alert('Enter a six-digit code.');
            return;
        }

        const { error } = await db.rpc(
            'join_couple_invite',
            { invite_code: code }
        );

        if (error) {
            alert(error.message);
            return;
        }

        alert('You joined the couple space!');
        await refreshCouple();
    };

    // Logout
    $('logout').onclick = async () => {
        await db.auth.signOut();

        user = null;

        $('appPanel').classList.add('hidden');
        $('bottomNav').classList.add('hidden');
        $('authPanel').classList.remove('hidden');

        setMode('login');
    };

    // Supabase setup
    if (
        !cfg.supabaseUrl ||
        !cfg.supabasePublishableKey ||
        cfg.supabaseUrl.includes('PASTE_') ||
        cfg.supabasePublishableKey.includes('PASTE_')
    ) {
        say('Setup required: check config.js');
        $('authSubmit').disabled = true;
        return;
    }

    db = window.supabase.createClient(
        cfg.supabaseUrl,
        cfg.supabasePublishableKey
    );

    // Restore existing session
    db.auth.getSession().then(async ({ data, error }) => {
        if (error) {
            console.error(error);
            return;
        }

        if (data.session) {
            user = data.session.user;
            await ensureProfile();
            await showApp();
        }
    });

})();
