export class GitHubManager {
    constructor() {
        this.username = 'hiddenSharp429';
        this.allProjects = [];
        this.colors = {
            JavaScript: '#f1e05a',
            Python: '#3572A5',
            HTML: '#e34c26',
            CSS: '#563d7c',
            Java: '#b07219',
            Vue: '#2c3e50',
            TypeScript: '#2b7489',
            Shell: '#89e051',
        };
        
        this.initialize();
    }

    initialize() {
        this.fetchGitHubProjects();
        this.fetchGitHubLanguages();
        this.setupRefreshButton();
    }

    getLanguageColor(language) {
        return this.colors[language] || '#858585';
    }

    async fetchGitHubProjects() {
        try {
            const response = await fetch(`https://api.github.com/users/${this.username}/repos?sort=updated&direction=desc`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.allProjects = await response.json();
            this.displayProjects(this.allProjects);
        } catch (error) {
            console.error('Error fetching GitHub projects:', error);
            document.getElementById('projects-container').innerHTML = 
                `<p>Error loading projects. Please try again later.</p>`;
        }
    }

    displayProjects(projects) {
        const container = document.getElementById('projects-container');
        container.innerHTML = '';

        projects.slice(0, 10).forEach(project => {
            const projectElement = document.createElement('div');
            projectElement.className = 'project-item';
            projectElement.innerHTML = `
                <h3><a href="${project.html_url}" target="_blank">${project.name}</a></h3>
                <p>${project.description || 'No description available.'}</p>
                <div class="project-meta">
                    <span class="project-language" style="background-color: ${this.getLanguageColor(project.language)}">${project.language}</span>
                    <span class="project-stars"><i class="fas fa-star"></i>${project.stargazers_count}</span>
                </div>
            `;
            container.appendChild(projectElement);
        });
    }

    async fetchGitHubLanguages() {
        try {
            const response = await fetch(`https://api.github.com/users/${this.username}/repos`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const repos = await response.json();
            
            const languages = {};
            repos.forEach(repo => {
                if (repo.language) {
                    languages[repo.language] = (languages[repo.language] || 0) + 1;
                }
            });
            this.displayLanguages(languages);
        } catch (error) {
            console.error('Error fetching GitHub data:', error);
            document.getElementById('github-languages').innerHTML = 
                `<p>Error loading language statistics. Please try again later.</p>`;
        }
    }

    displayLanguages(languages) {
        const container = document.getElementById('github-languages');
        container.innerHTML = '';
        const totalRepos = Object.values(languages).reduce((a, b) => a + b, 0);
        
        Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .forEach(([language, count]) => {
                const percentage = ((count / totalRepos) * 100).toFixed(1);
                const languageItem = document.createElement('div');
                languageItem.className = 'language-item';
                languageItem.innerHTML = `
                    <span class="language-color" style="background-color: ${this.getLanguageColor(language)}"></span>
                    <span class="language-name">${language}</span>
                    <span class="language-percentage">${percentage}%</span>
                `;
                container.appendChild(languageItem);
            });
    }

    setupRefreshButton() {
        const refreshButton = document.getElementById('refresh-projects');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                const shuffled = [...this.allProjects].sort(() => 0.5 - Math.random());
                this.displayProjects(shuffled);
            });
        }
    }
}