const API_KEY = '9PxEif7cD3fe8NTgXJZbp6A1pE0wrgur';
const USERNAME = 'ChristIBelieve';

// ==========================================
// 1. Helper to find Missable IDs from the Wiki Guide
// ==========================================
async function getMissableAchievementIdsFromWiki(gameTitle) {
    // We search for the guide page on GitHub, as that's where the official guides live.
    const searchQuery = `${gameTitle} retroachievements guide missable`;
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&skip_disambig=1`;

    try {
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        const guideUrl = searchData.AbstractURL || searchData.RelatedTopics?.[0]?.FirstURL;

        if (!guideUrl) return null;

        // Fetch the guide page
        const guideRes = await fetch(guideUrl);
        const guideText = await guideRes.text();

        // Regex to find achievement IDs. The pattern looks for links to /achievement/xxxxx
        const achIdRegex = /\/achievement\/(\d+)/g;
        const missableIds = new Set();
        let match;
        while ((match = achIdRegex.exec(guideText)) !== null) {
            missableIds.add(parseInt(match[1], 10));
        }

        console.log(`[Guide] Found ${missableIds.size} potential missable IDs for ${gameTitle}`);
        return missableIds.size > 0 ? missableIds : null;
    } catch (error) {
        console.error(`[Guide] Failed to fetch for ${gameTitle}:`, error);
        return null;
    }
}

// ==========================================
// 2. Check if an Achievement is Earned
// ==========================================
function isAchievementEarned(achievement, gameData) {
    // Check for any earned date
    if (achievement.DateEarned && achievement.DateEarned !== '0000-00-00 00:00:00') return true;
    if (achievement.dateEarned && achievement.dateEarned !== '0000-00-00 00:00:00') return true;

    // Check boolean flags
    if (achievement.Achieved === true || achievement.Achieved === 1) return true;
    if (achievement.achieved === true || achievement.achieved === 1) return true;

    // Check the earned achievements list from the API
    if (gameData?.EarnedAchievements) {
        const achId = achievement.ID || achievement.id;
        if (achId && gameData.EarnedAchievements[achId]) return true;
    }

    return false;
}

// ==========================================
// 3. Main Scanner Function
// ==========================================
async function scanForMissable() {
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const loadingLog = document.getElementById('loadingLog');
    const scanBtn = document.getElementById('scanBtn');

    loadingDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
    scanBtn.disabled = true;
    loadingLog.innerHTML = '>_ FETCHING RECENT GAMES...\n';

    try {
        // 1. Get recent games (up to 20)
        const gamesRes = await fetch(`https://retroachievements.org/API/API_GetUserRecentlyPlayedGames.php?u=${USERNAME}&y=${API_KEY}&c=20`);
        if (!gamesRes.ok) throw new Error(`HTTP ${gamesRes.status}`);
        const games = await gamesRes.json();

        if (!games || games.length === 0) {
            resultsDiv.innerHTML = '<div class="empty-state">⚠️ No recent games found. Play something first.</div>';
            loadingDiv.style.display = 'none';
            scanBtn.disabled = false;
            return;
        }

        loadingLog.innerHTML += `✓ FOUND ${games.length} GAMES\n\n`;

        // 2. For each game, fetch achievements and find missable ones
        const allResults = [];

        for (let i = 0; i < games.length; i++) {
            const game = games[i];
            loadingLog.innerHTML += `[${i+1}/${games.length}] SCANNING: ${game.Title}...\n`;

            const gameRes = await fetch(`https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?g=${game.GameID}&u=${USERNAME}&y=${API_KEY}`);
            if (!gameRes.ok) {
                loadingLog.innerHTML += `  ❌ FAILED\n`;
                continue;
            }

            const gameData = await gameRes.json();
            const achievements = gameData.Achievements || {};
            const missableList = [];

            // 2a. First, try to find missable IDs from the modern API 'Type' field
            let modernMissableIds = [];
            for (const [achId, ach] of Object.entries(achievements)) {
                if (ach.Type === 'missable') {
                    modernMissableIds.push(parseInt(achId, 10));
                }
            }

            let missableIds = modernMissableIds;

            // 2b. If no modern 'missable' type found, try to fetch from the community Wiki
            if (modernMissableIds.length === 0) {
                loadingLog.innerHTML += `  ⚠️ No modern missable tags. Searching community guide...\n`;
                const guideIds = await getMissableAchievementIdsFromWiki(game.Title);
                if (guideIds && guideIds.size > 0) {
                    missableIds = Array.from(guideIds);
                    loadingLog.innerHTML += `  ✓ Found ${missableIds.length} IDs from community guide.\n`;
                } else {
                    loadingLog.innerHTML += `  ✗ No community guide found. Falling back to title keyword scan.\n`;
                    // 2c. Ultimate fallback: Scan titles for [m] tag
                    for (const [achId, ach] of Object.entries(achievements)) {
                        if (ach.Title && ach.Title.toLowerCase().includes('[m]')) {
                            missableIds.push(parseInt(achId, 10));
                        }
                    }
                }
            }

            // 2d. Now, cross-reference the found IDs with your earned progress
            for (const [achId, ach] of Object.entries(achievements)) {
                const earned = isAchievementEarned(ach, gameData);
                const isMissableId = missableIds.includes(parseInt(achId, 10));
                
                if (!earned && isMissableId) {
                    missableList.push({
                        id: achId,
                        title: ach.Title,
                        description: ach.Description || 'No description',
                        points: ach.Points
                    });
                }
            }

            loadingLog.innerHTML += `  → ${missableList.length} MISSABLE ACHIEVEMENTS FOUND\n`;

            allResults.push({
                gameTitle: game.Title,
                consoleName: game.ConsoleName,
                imageIcon: game.ImageIcon,
                achievements: missableList,
                missableCount: missableList.length
            });

            await new Promise(r => setTimeout(r, 250));
        }

        loadingLog.innerHTML += `\n>_ SCAN COMPLETE. RENDERING RESULTS...\n`;

        // 3. Display results
        if (allResults.every(r => r.missableCount === 0)) {
            resultsDiv.innerHTML = '<div class="empty-state">🛡️ NO MISSABLE ACHIEVEMENTS FOUND IN YOUR RECENT GAMES.</div>';
        } else {
            resultsDiv.innerHTML = allResults.map(game => {
                const iconUrl = game.imageIcon ? `https://retroachievements.org${game.imageIcon}` : null;
                return `
                    <div class="game-card">
                        <div class="game-header" onclick="toggleGameContent(this)">
                            <div class="game-icon">
                                ${iconUrl ? `<img class="game-icon-img" src="${iconUrl}" onerror="this.parentElement.innerHTML='<div class=\'game-icon-placeholder\'>🎮</div>'">` : '<div class="game-icon-placeholder">🎮</div>'}
                            </div>
                            <div class="game-info">
                                <div class="game-title">${escapeHtml(game.gameTitle)}</div>
                                <div class="game-console">${escapeHtml(game.consoleName || 'RetroAchievements')}</div>
                            </div>
                            <div class="missable-count">⚠️ ${game.missableCount} missable</div>
                            <div class="expand-icon">▼</div>
                        </div>
                        <div class="game-content">
                            <div class="achievements-list">
                                ${game.achievements.length === 0 ? 
                                    `<div style="color:#5f9e6e; padding:15px; text-align:center;">✓ No unearned missable achievements in this game.</div>` :
                                    game.achievements.map(ach => `
                                        <div class="achievement-card">
                                            <div class="achievement-title">
                                                🏆 ${escapeHtml(ach.title)}
                                                <span class="missable-badge">MISSABLE</span>
                                            </div>
                                            <div class="achievement-desc">${escapeHtml(ach.description)}</div>
                                            <div class="achievement-footer">
                                                <span class="achievement-points">⭐ ${ach.points} pts</span>
                                                <a href="https://retroachievements.org/achievement/${ach.id}" target="_blank" class="achievement-link">
                                                    💬 VIEW DISCUSSION
                                                </a>
                                            </div>
                                        </div>
                                    `).join('')
                                }
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

    } catch (err) {
        console.error(err);
        resultsDiv.innerHTML = `<div class="empty-state">⚠️ ERROR: ${err.message}</div>`;
    } finally {
        loadingDiv.style.display = 'none';
        scanBtn.disabled = false;
    }
}

function toggleGameContent(header) {
    const content = header.nextElementSibling;
    content.classList.toggle('open');
    const icon = header.querySelector('.expand-icon');
    if (icon) icon.textContent = content.classList.contains('open') ? '▲' : '▼';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

document.getElementById('scanBtn').addEventListener('click', scanForMissable);