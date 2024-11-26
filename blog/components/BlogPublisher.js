import { db, auth } from '../../js/firebase-config.js';
import { 
    collection, addDoc, serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

export class BlogPublisher {
    constructor(container) {
        this.container = container;
        this.tags = [];
        this.mdFileInput = document.createElement('input');
        this.mdFileInput.type = 'file';
        this.mdFileInput.accept = '.md';
        this.mdFileInput.style.display = 'none';
        this.container.appendChild(this.mdFileInput);
        
        this.initialize();
    }

    async initialize() {
        await this.loadTags();
        this.bindEvents();
    }

    async loadTags() {
        try {
            const response = await fetch('/blog/config/tags.json');
            if (!response.ok) {
                throw new Error('Failed to load tags');
            }
            const data = await response.json();
            this.tags = data.tags;
        } catch (error) {
            console.error('Error loading tags:', error);
            this.tags = [
                { id: 'uncategorized', name: '未分类', color: '#666666' }
            ];
        }
    }

    bindEvents() {
        this.mdFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await this.handleMdFileSelect(file);
                    alert('博客发布成功！');
                } catch (error) {
                    if (error !== '用户取消发布') {
                        console.error('Failed to publish blog:', error);
                    }
                }
            }
        });
    }

    showTagSelector(content, title) {
        return new Promise((resolve, reject) => {
            const modal = document.createElement('div');
            modal.className = 'tag-selector-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2>选择标签</h2>
                    <p class="blog-preview">标题：${title}</p>
                    <div class="tags-container">
                        ${this.tags.map(tag => `
                            <label class="tag-option">
                                <input type="checkbox" value="${tag.id}" 
                                    data-color="${tag.color}" 
                                    data-name="${tag.name}">
                                <span class="tag-name" style="background-color: ${tag.color}">
                                    ${tag.name}
                                </span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button class="cancel-btn">取消</button>
                        <button class="confirm-btn">确认发布</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const confirmBtn = modal.querySelector('.confirm-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');

            confirmBtn.addEventListener('click', () => {
                const selectedTags = Array.from(modal.querySelectorAll('input:checked'))
                    .map(input => ({
                        id: input.value,
                        name: input.dataset.name,
                        color: input.dataset.color
                    }));

                if (selectedTags.length === 0) {
                    alert('请至少选择一个标签');
                    return;
                }

                document.body.removeChild(modal);
                resolve({ content, title, tags: selectedTags });
            });

            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                reject('用户取消发布');
            });
        });
    }

    async handleMdFileSelect(file) {
        try {
            const content = await file.text();
            const title = file.name.replace('.md', '');

            // 显示标签选择器并等待用户选择
            const blogData = await this.showTagSelector(content, title);
            
            // 生成摘要
            const summary = content
                .replace(/[#*`]/g, '')
                .split('\n')
                .filter(line => line.trim())
                .slice(0, 3)
                .join(' ')
                .slice(0, 200) + '...';

            // 发布博客
            await this.publishBlog({
                title,
                content,
                summary,
                tags: blogData.tags
            });

            // 清空文件输入
            this.mdFileInput.value = '';
            
            return true;
        } catch (error) {
            console.error('Error processing MD file:', error);
            if (error !== '用户取消发布') {
                alert('发布博客失败：' + error.message);
            }
            throw error;
        }
    }

    async publishBlog(blogData) {
        try {
            await addDoc(collection(db, 'posts'), {
                title: blogData.title,
                content: blogData.content,
                summary: blogData.summary,
                tags: blogData.tags,
                author: auth.currentUser.displayName || '管理员',
                authorId: auth.currentUser.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // 触发博客列表刷新
            window.dispatchEvent(new CustomEvent('blogPublished'));
            
            return true;
        } catch (error) {
            console.error('Error publishing blog:', error);
            throw error;
        }
    }

    triggerFileSelect() {
        this.mdFileInput.click();
    }
}