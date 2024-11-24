export class AnimationManager {
    constructor() {
        this.stage1 = document.querySelector('.stage-1');
        this.stage2 = document.querySelector('.stage-2');
        this.initialize();
    }

    initialize() {
        setTimeout(() => {
            this.stage1.style.animation = 'fadeOut 1s ease-out forwards';
            
            setTimeout(() => {
                this.stage1.classList.add('hidden');
                this.stage2.classList.remove('hidden');
            }, 1000);
        }, 1500);
    }
}