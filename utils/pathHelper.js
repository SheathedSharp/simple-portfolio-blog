// /utils/pathHelper.js
export function getBasePath() {
    const repoPath = window.location.pathname.split('/')[1];
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    if (isGitHubPages) {
        return `/${repoPath}`;
    } else {
        return window.location.pathname.includes('/blog/') ? '../' : './';
    }
}