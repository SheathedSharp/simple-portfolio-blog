import { db } from '../../js/firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function importPosts() {
    const postsDir = path.join(process.cwd(), 'blog', 'posts');
    const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));

    for (const file of files) {
        const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
        const title = path.basename(file, '.md');
        
        try {
            await addDoc(collection(db, 'posts'), {
                title,
                content,
                summary: content.replace(/[#*`]/g, '').slice(0, 200) + '...',
                tags: ['导入文章'],
                author: '管理员',
                authorId: 'admin',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log(`Imported: ${title}`);
        } catch (error) {
            console.error(`Error importing ${title}:`, error);
        }
    }
}

importPosts().then(() => console.log('Import complete'));