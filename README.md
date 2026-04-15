# 🎮 RA Missable Achievement Scanner

A personal tool that scans my RetroAchievements recently played games and shows me exactly which achievements are permanently missable – so I never lock myself out of an achievement again.

## 🔗 Live Demo

*Deployed at:* `https://roysworth.github.io/ra-missable-scanner`  
*(You'll need your own RA username and API key to use it.)*

---

## 🛠️ Built With

- HTML5, CSS3, JavaScript (ES6)
- RetroAchievements Web API
- DuckDuckGo API (to find community guides)

---

## 🚀 Features

- Fetches my **recently played games** automatically (no hardcoded list)
- Shows **only unearned, missable achievements**
- Displays game box art
- Links directly to each achievement's discussion page for tips
- Falls back to community guides when the API lacks `missable` tags

---

## 📚 What I Learned

| Skill | How I Used It |
|-------|----------------|
| REST API Integration | Fetched user games and achievement data from RetroAchievements |
| Async/Await | Handled sequential API calls with rate limiting |
| DOM Manipulation | Dynamically built collapsible game cards and achievement lists |
| Web Scraping (light) | Located community guide URLs and extracted achievement IDs |
| Error Handling | Graceful fallbacks when guides or API calls fail |
| CSS Grid & Flexbox | Responsive green‑motherboard terminal layout |
| Git & GitHub Pages | Version control and deployment |

---

## 💡 Why I Built This

I got tired of playing a game for hours only to realize I missed a single achievement because I didn't talk to an NPC before some random point of no return. This scanner solves that frustration by telling me, *before* I start, what's missable. Also, a lot of the times you're also not going to know *how* the achievement is missable. Thus, the tool also provides a link to forum discussions that should bear helpful advice for when you tackle it.

---

## 🔧 How to Run Locally

1. Clone the repo
2. Open in VS Code
3. Use **Live Server** (double‑clicking won't work due to CORS)
4. Add your own RA API key in `script.js`
5. Click **SCAN FOR MISSABLE ACHIEVEMENTS**

---

## 🗺️ Future Improvements

- Cache guide lookups
- Save API key in localStorage
- Add a "hide earned games" toggle

---

## 🙏 Acknowledgments

- [RetroAchievements](https://retroachievements.org) for the API
- Community guide writers for keeping missable lists alive

---

**Made by roysworth / ChristIBelieve** – because missing achievements is optional.
