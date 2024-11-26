export class ScrollManager {
    constructor(sections, navLinks) {
        this.sections = sections;
        this.navLinks = navLinks;
        this.currentSection = 0;
        this.isScrolling = false;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        window.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        window.addEventListener('scroll', this.handleScroll.bind(this));
        this.initializeNavLinks();
        this.initializeKeyboardControls();
    }

    scrollToSection(index) {
        if (index >= 0 && index < this.sections.length && !this.isScrolling) {
            this.isScrolling = true;
            this.sections[index].scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                this.isScrolling = false;
                this.currentSection = index;
                this.updateActiveLink();
            }, 1000);
        }
    }

    updateActiveLink() {
        let activeIndex = this.currentSection;
        if (this.currentSection === 1 || this.currentSection === 2) {
            activeIndex = 1;
        } else if (this.currentSection > 2) {
            activeIndex = this.currentSection - 1;
        }

        this.navLinks.forEach((link, index) => {
            if (index === activeIndex) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    handleScroll() {
        const scrollPosition = window.pageYOffset;
        this.sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                this.currentSection = index;
                this.updateActiveLink();
            }
        });
    }

    handleWheel(e) {
        e.preventDefault();
        if (e.deltaY > 0) {
            this.scrollToSection(this.currentSection + 1);
        } else {
            this.scrollToSection(this.currentSection - 1);
        }
    }

    initializeNavLinks() {
        this.navLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                let targetIndex = index;
                if (index > 1) {
                    targetIndex = index + 1;
                }
                this.scrollToSection(targetIndex);
            });
        });
    }

    initializeKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'PageDown') {
                this.scrollToSection(this.currentSection + 1);
            } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                this.scrollToSection(this.currentSection - 1);
            }
        });
    }
} 