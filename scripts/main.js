document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('nav a');
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
                updateNavigation();
            }, 1000);
        }
    }

    function updateNavigation() {
        navLinks.forEach((link, index) => {
            if (index === currentSection) {
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
                updateNavigation();
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
            scrollToSection(index);
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

    updateNavigation();
});
