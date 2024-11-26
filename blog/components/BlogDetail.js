import { db } from '../../scripts/firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { Comments } from './BlogComments.js';

export class BlogDetail {
    constructor() {
        this.container = document.getElementById('blogContent');
        this.configureMarked();
        if (this.container) {
            this.initialize();
        }
    }

    configureMarked() {
        const renderer = new marked.Renderer();
        
        // 自定义表格渲染
        renderer.table = (header, body) => {
            if (typeof header === 'object' && header.header) {
                // 处理表头
                const headerContent = header.header.map(cell => {
                    // 检查是否包含 HTML 标签
                    if (cell.text && (cell.text.includes('<img') || cell.text.includes('<a'))) {
                        return `<th>${cell.text}</th>`;
                    }
                    // 否则使用 marked.parseInline 处理普通 Markdown
                    const cellContent = marked.parseInline(cell.text || '');
                    return `<th>${cellContent}</th>`;
                }).join('');
                
                // 处理表格内容
                const bodyContent = header.rows.map(row => {
                    const cells = row.map(cell => {
                        // 检查是否包含 HTML 标签
                        if (cell.text && (cell.text.includes('<img') || cell.text.includes('<a'))) {
                            return `<td>${cell.text}</td>`;
                        }
                        // 否则使用 marked.parseInline 处理普通 Markdown
                        const cellContent = marked.parseInline(cell.text || '');
                        return `<td>${cellContent}</td>`;
                    }).join('');
                    return `<tr>${cells}</tr>`;
                }).join('');
                
                return `
                    <div class="table-wrapper">
                        <table class="markdown-table">
                            <thead><tr>${headerContent}</tr></thead>
                            <tbody>${bodyContent}</tbody>
                        </table>
                    </div>
                `;
            }
            
            // 如果格式不匹配，返回空表格
            return `
                <div class="table-wrapper">
                    <table class="markdown-table">
                        <thead>${header}</thead>
                        <tbody>${body || ''}</tbody>
                    </table>
                </div>
            `;
        };

        // 自定义图片渲染
        renderer.image = (href, title, text) => {
            // 如果href是对象，提取实际的URL
            const originalUrl = (typeof href === 'object' && href.href) ? href.href : href;
            
            // 使用图片代理服务
            const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}`;
            
            // 如果href是对象，提取实际的text
            const imageText = (typeof href === 'object' && href.text) ? href.text : text;

            // 构建图片标签
            const imgTag = `<img 
                src="${proxyUrl}"
                alt="${imageText || ''}"
                ${title ? `title="${title}"` : ''}
                loading="lazy"
                onerror="console.error('Failed to load image:', this.src);"
            >`;
            
            return imgTag;
        };

        // 自定义代码块渲染
        renderer.code = (code, language) => {
            try {
                // 确保代码是字符串类型
                code = String(code);
                // 移除可能存在的最后一个换行符
                code = code.replace(/\n$/, '');
                
                if (!language) {
                    return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
                }

                const validLanguage = Prism.languages[language] ? language : 'plaintext';
                const highlighted = Prism.highlight(
                    code,
                    Prism.languages[validLanguage],
                    validLanguage
                );
                return `<pre><code class="language-${validLanguage}">${highlighted}</code></pre>`;
            } catch (error) {
                console.error('Code highlighting error:', error);
                return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
            }
        };

        // 自定义行内代码渲染
        renderer.codespan = (code) => {
            return `<code class="inline-code">${this.escapeHtml(code)}</code>`;
        };

        // 配置 marked 选项
        marked.setOptions({
            renderer: renderer,
            gfm: true,
            breaks: true,
            pedantic: false,
            sanitize: false,
            smartLists: true,
            smartypants: false,
            mangle: false,
            headerIds: false
        });
    }

    // HTML 转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        
        if (!postId) {
            this.renderError('未找到博客ID');
            return;
        }

        await this.loadPost(postId);
    }

    async loadPost(postId) {
        try {
            const docRef = doc(db, 'posts', postId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const post = {
                    id: docSnap.id,
                    ...docSnap.data(),
                    date: docSnap.data().createdAt?.toDate().toLocaleDateString('zh-CN')
                };
                
                // 先渲染博客内容
                this.render(post);
                
                // 等待 DOM 更新后再初始化评论系统
                requestAnimationFrame(() => {
                    const commentsContainer = this.container.querySelector('.comments-section');
                    if (commentsContainer) {
                        new Comments(post.id, commentsContainer);
                    }
                });
            } else {
                this.renderError('博客不存在');
            }
        } catch (error) {
            console.error('Error loading post:', error);
            this.renderError('加载博客失败');
        }
    }

    render(post) {
        let content = post.content;

        // 1. 保护 HTML 标签（特别是图片标签）
        const htmlTags = [];
        content = content.replace(/(<img[^>]+>)/g, (match) => {
            htmlTags.push(match);
            return `@@HTML_TAG_${htmlTags.length - 1}@@`;
        });

        // 2. 保护代码块和行内代码
        const codeBlocks = [];
        // 首先处理多行代码块
        content = content.replace(/```([\s\S]*?)```/g, (match, code) => {
            const lines = code.split('\n');
            let language = '';
            let codeContent = code;

            // 检查第一行是否包含语言标识
            if (lines.length > 0) {
                const firstLine = lines[0].trim();
                if (firstLine && !firstLine.includes(' ')) {
                    language = firstLine;
                    codeContent = lines.slice(1).join('\n');
                }
            }

            const blockInfo = {
                type: 'block',
                language,
                content: codeContent.trim()
            };
            codeBlocks.push(blockInfo);
            return `@@CODE_BLOCK_${codeBlocks.length - 1}@@`;
        });

        // 然后处理行内代码
        content = content.replace(/`([^`]+)`/g, (match, code) => {
            codeBlocks.push({
                type: 'inline',
                content: code
            });
            return `@@CODE_BLOCK_${codeBlocks.length - 1}@@`;
        });

        // 3. 保护数学公式
        const mathBlocks = [];
        content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
            mathBlocks.push(match);
            return `@@MATH_BLOCK_${mathBlocks.length - 1}@@`;
        });
        content = content.replace(/\$([^\$\n]+?)\$/g, (match) => {
            mathBlocks.push(match);
            return `@@MATH_INLINE_${mathBlocks.length - 1}@@`;
        });

        // 4. 处理 Markdown
        let html = marked.parse(content);

        // 5. 恢复 HTML 标签
        html = html.replace(/@@HTML_TAG_(\d+)@@/g, (_, index) => htmlTags[index]);

        // 6. 恢复代码块
        html = html.replace(/@@CODE_BLOCK_(\d+)@@/g, (_, index) => {
            const block = codeBlocks[index];
            if (block.type === 'inline') {
                return `<code class="inline-code">${this.escapeHtml(block.content)}</code>`;
            } else {
                const language = block.language || 'plaintext';
                try {
                    if (Prism.languages[language]) {
                        const highlighted = Prism.highlight(
                            block.content,
                            Prism.languages[language],
                            language
                        );
                        return `<pre><code class="language-${language}">${highlighted}</code></pre>`;
                    }
                } catch (error) {
                    console.error('Code highlighting error:', error);
                }
                return `<pre><code>${this.escapeHtml(block.content)}</code></pre>`;
            }
        });

        // 7. 恢复数学公式
        html = html.replace(/@@MATH_BLOCK_(\d+)@@/g, (_, index) => mathBlocks[index]);
        html = html.replace(/@@MATH_INLINE_(\d+)@@/g, (_, index) => mathBlocks[index]);

        // 8. 渲染到页面
        this.container.innerHTML = `
            <article class="blog-post">
                <h1 class="blog-post-title">${post.title}</h1>
                <div class="blog-post-meta">
                    <span class="blog-date">
                        <i class="far fa-calendar-alt"></i> ${post.date}
                    </span>
                    <span class="blog-author">
                        <i class="far fa-user"></i> ${post.author}
                    </span>
                    ${post.tags ? `
                        <div class="blog-tags">
                            ${post.tags.map(tag => `
                                <span class="blog-tag" style="background-color: ${tag.color || '#666'}">${tag.name}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="blog-post-content math">
                    ${html}
                </div>
                <div class="blog-post-footer">
                    <a href="../index.html#blog" class="back-to-list">
                        <i class="fas fa-arrow-left"></i> 返回博客列表
                    </a>
                </div>
            </article>
            
            <!-- 添加评论区容器 -->
            <div class="comments-section">
                <h3>评论</h3>
                <div class="comment-form-section"></div>
                <div class="comments-list"></div>
            </div>
        `;

        // 9. 渲染数学公式
        if (window.MathJax) {
            MathJax.typesetPromise([this.container])
                .catch(err => console.error('MathJax error:', err));
        }

        // 10. 代码高亮
        Prism.highlightAll();
    }

    renderError(message = '加载失') {
        this.container.innerHTML = `
            <div class="blog-error">
                <h2>${message}</h2>
                <p>抱歉，无法加载所请求的文。</p>
                <a href="../index.html#blog" class="back-to-list">
                    <i class="fas fa-arrow-left"></i> 返回博客列表
                </a>
            </div>
        `;
    }
}

// 只在详情页面初始化
if (document.getElementById('blogContent')) {
    new BlogDetail();
}