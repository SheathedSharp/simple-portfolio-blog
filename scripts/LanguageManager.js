export class LanguageManager {
    constructor() {
        this.currentLanguage = 'zh';
        this.translations = {};
        console.log('LanguageManager initialized');  // 调试日志
        this.initializeLanguageSystem();
    }

    async initializeLanguageSystem() {
        try {
            const response = await fetch('../languages.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.translations = await response.json();
            this.updateLanguage(this.currentLanguage);
            this.setupLanguageToggle();
        } catch (error) {
            console.error('Error loading language file:', error);
        }
    }

    setupLanguageToggle() {
        const languageToggle = document.getElementById('languageToggle');
        const languageDropdown = document.getElementById('languageDropdown');
        const currentLangSpan = document.querySelector('.current-lang');

        // 添加点击外部关闭下拉菜单的功能
        document.addEventListener('click', (e) => {
            if (!languageToggle.contains(e.target)) {
                languageDropdown.classList.add('hidden');
            }
        });

        languageToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            languageDropdown.classList.toggle('hidden');
        });

        languageDropdown.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const newLang = e.target.getAttribute('data-lang');
                const oldLang = this.currentLanguage;
                
                // 添加过渡效果
                currentLangSpan.style.opacity = '0';
                setTimeout(() => {
                    this.currentLanguage = newLang;
                    this.updateLanguage(newLang);
                    currentLangSpan.textContent = e.target.textContent;
                    currentLangSpan.style.opacity = '1';
                }, 200);

                languageDropdown.classList.add('hidden');
            }
        });
    }

    updateLanguage(lang) {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.getNestedTranslation(this.translations[lang], key);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.getNestedTranslation(this.translations[lang], key);
        });

        document.documentElement.lang = lang;
    }

    getNestedTranslation(obj, path) {
        return path.split('.').reduce((p, c) => p && p[c] || null, obj);
    }
} 