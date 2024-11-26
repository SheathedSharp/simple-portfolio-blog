import { ScrollManager } from './ScrollManager.js';
import { LanguageManager } from './LanguageManager.js';
import { GitHubManager } from './GitHubManager.js';
import { AnimationManager } from './AnimationManager.js';
import { AuthManager } from './AuthManager.js';
import { BlogManager } from './BlogManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize managers
    const authManager = new AuthManager();
    const scrollManager = new ScrollManager(
        document.querySelectorAll('.section'),
        document.querySelectorAll('nav ul li a')
    );
    const languageManager = new LanguageManager();
    const githubManager = new GitHubManager();
    const animationManager = new AnimationManager();
    const blogManager = new BlogManager();

    githubManager.fetchGitHubProjects();    // 获取项目列表
    githubManager.fetchGitHubLanguages();   // 获取语言统计

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        if (hash.startsWith('#blog/')) {
            const postId = hash.split('/')[1];
            blogManager.showPost(postId);
        }
    });

    // Form submission handler
    document.querySelector('form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('感谢您的留言！我会尽快回复。');
        e.target.reset();
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href'))?.scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});