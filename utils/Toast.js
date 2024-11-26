export class Toast {
    static show(message, type = 'info', duration = 3000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };

        const iconHtml = icons[type] || icons.info;

        toast.innerHTML = `
            <div class="toast-icon">${iconHtml}</div>
            <span class="toast-message">${message}</span>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // 添加进入动画
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 绑定关闭按钮事件
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.dismiss(toast);
        });

        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        return toast;
    }

    static success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    static error(message, duration = 3000) {
        return this.show(message, 'error', duration);
    }

    static info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    static dismiss(toast) {
        if (!toast) return;
        
        // 添加移除动画
        toast.classList.add('removing');
        
        // 监听动画结束
        const handleAnimationEnd = () => {
            toast.removeEventListener('animationend', handleAnimationEnd);
            toast.remove();
            
            // 检查容器是否为空，如果为空则移除容器
            const container = document.getElementById('toast-container');
            if (container && !container.hasChildNodes()) {
                container.remove();
            }
        };
        
        toast.addEventListener('animationend', handleAnimationEnd);
    }
}