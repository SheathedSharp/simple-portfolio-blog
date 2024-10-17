document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('nav ul li a');
    let currentSection = 0;
    let isScrolling = false;
    let currentLanguage = 'zh';
    let translations = {};

    // 加载语言文件
    fetch('languages.json')
        .then(response => response.json())
        .then(data => {
            translations = data;
            updateLanguage(currentLanguage);
        });

    function scrollToSection(index) {
        if (index >= 0 && index < sections.length && !isScrolling) {
            isScrolling = true;
            sections[index].scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                isScrolling = false;
                currentSection = index;
                updateActiveLink();
            }, 1000);
        }
    }

    function updateActiveLink() {
        let activeIndex = currentSection;
        // 处理"关于"部分的两个页面
        if (currentSection === 1 || currentSection === 2) {
            activeIndex = 1; // "关于"导航项的索引
        } else if (currentSection > 2) {
            activeIndex = currentSection - 1; // 因为"关于"占用了两个section，所以后面的索引需要减1
        }

        navLinks.forEach((link, index) => {
            if (index === activeIndex) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function handleScroll() {
        const scrollPosition = window.pageYOffset;
        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = index;
                updateActiveLink();
            }
        });
    }

    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY > 0) {
            scrollToSection(currentSection + 1);
        } else {
            scrollToSection(currentSection - 1);
        }
    }, { passive: false });

    window.addEventListener('scroll', handleScroll);

    navLinks.forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            let targetIndex = index;
            if (index > 1) {
                targetIndex = index + 1; // 因为"关于"占用了两个section，所以后面的索引需要加1
            }
            scrollToSection(targetIndex);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            scrollToSection(currentSection + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            scrollToSection(currentSection - 1);
        }
    });

    // 表单提交
    document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('感谢您的留言！我会尽快回复。');
        e.target.reset();
    });

    // 语言切换功能
    const languageToggle = document.getElementById('languageToggle');
    const languageDropdown = document.getElementById('languageDropdown');
    const currentLangSpan = document.querySelector('.current-lang');

    languageToggle.addEventListener('click', () => {
        languageDropdown.classList.toggle('hidden');
    });

    languageDropdown.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            currentLanguage = e.target.getAttribute('data-lang');
            updateLanguage(currentLanguage);
            languageDropdown.classList.add('hidden');
            currentLangSpan.textContent = e.target.textContent;
        }
    });

    function updateLanguage(lang) {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = getNestedTranslation(translations[lang], key);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = getNestedTranslation(translations[lang], key);
        });

        document.documentElement.lang = lang;
    }
    function getNestedTranslation(obj, path) {
        return path.split('.').reduce((p, c) => p && p[c] || null, obj);
    }

    let allProjects = [];

    function getLanguageColor(language) {
        const colors = {
            JavaScript: '#f1e05a',
            Python: '#3572A5',
            HTML: '#e34c26',
            CSS: '#563d7c',
            Java: '#b07219',
            // 添加更多语言和对应的颜色
        };
        return colors[language] || '#858585';
    }

    function displayProjects(projects) {
        const container = document.getElementById('projects-container');
        container.innerHTML = '';

        projects.slice(0, 10).forEach(project => {
            const projectElement = document.createElement('div');
            projectElement.className = 'project-item';
            projectElement.innerHTML = `
                <h3><a href="${project.html_url}" target="_blank">${project.name}</a></h3>
                <p>${project.description || 'No description available.'}</p>
                <div class="project-meta">
                    <span class="project-language" style="background-color: ${getLanguageColor(project.language)}">${project.language}</span>
                    <span class="project-stars"><i class="fas fa-star"></i>${project.stargazers_count}</span>
                </div>
            `;
            container.appendChild(projectElement);
        });
    }

    function fetchGitHubProjects() {
        const username = 'hiddenSharp429'; // 替换为您的GitHub用户名
        fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc`)
            .then(response => response.json())
            .then(repos => {
                allProjects = repos;
                displayProjects(allProjects);
            })
            .catch(error => console.error('Error fetching GitHub projects:', error));
    }

    function refreshProjects() {
        const shuffled = allProjects.sort(() => 0.5 - Math.random());
        displayProjects(shuffled);
    }

    // 在现有的DOMContentLoaded事件监听器中添加以下代码

    function fetchGitHubLanguages() {
        const username = 'hiddenSharp429'; // 替换为您的GitHub用户名
        fetch(`https://api.github.com/users/${username}/repos`)
            .then(response => response.json())
            .then(repos => {
                const languages = {};
                repos.forEach(repo => {
                    if (repo.language) {
                        languages[repo.language] = (languages[repo.language] || 0) + 1;
                    }
                });
                displayLanguages(languages);
            })
            .catch(error => console.error('Error fetching GitHub data:', error));
    }

    function displayLanguages(languages) {
        const container = document.getElementById('github-languages');
        const totalRepos = Object.values(languages).reduce((a, b) => a + b, 0);
        
        Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .forEach(([language, count]) => {
                const percentage = ((count / totalRepos) * 100).toFixed(1);
                const languageItem = document.createElement('div');
                languageItem.className = 'language-item';
                languageItem.innerHTML = `
                    <span class="language-color" style="background-color: ${getLanguageColor(language)}"></span>
                    <span class="language-name">${language}</span>
                    <span class="language-percentage">${percentage}%</span>
                `;
                container.appendChild(languageItem);
            });
    }

    function getLanguageColor(language) {
        const colors = {
            JavaScript: '#f1e05a',
            Python: '#3572A5',
            HTML: '#e34c26',
            CSS: '#563d7c',
            Java: '#b07219',
            // 添加更多语言和对应的颜色
        };
        return colors[language] || '#858585';
    }

    function displayProjects(projects) {
        const container = document.getElementById('projects-container');
        container.innerHTML = '';

        projects.slice(0, 10).forEach(project => {
            const projectElement = document.createElement('div');
            projectElement.className = 'project-item';
            projectElement.innerHTML = `
                <h3><a href="${project.html_url}" target="_blank">${project.name}</a></h3>
                <p>${project.description || 'No description available.'}</p>
                <div class="project-meta">
                    <span class="project-language" style="background-color: ${getLanguageColor(project.language)}">${project.language}</span>
                    <span class="project-stars"><i class="fas fa-star"></i>${project.stargazers_count}</span>
                </div>
            `;
            container.appendChild(projectElement);
        });
    }

    function fetchGitHubProjects() {
        const username = 'hiddenSharp429'; // 替换为您的GitHub用户名
        fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc`)
            .then(response => response.json())
            .then(repos => {
                allProjects = repos;
                displayProjects(allProjects);
            })
            .catch(error => console.error('Error fetching GitHub projects:', error));
    }

    function refreshProjects() {
        const shuffled = allProjects.sort(() => 0.5 - Math.random());
        displayProjects(shuffled);
    }

    // 在页面加载完成后调用此函数
    fetchGitHubLanguages();

    // 初始化激活状态
    updateActiveLink();

    // 调用函数获取GitHub项目数据
    fetchGitHubProjects();

    const refreshButton = document.getElementById('refresh-projects');
    refreshButton.addEventListener('click', refreshProjects);
});
