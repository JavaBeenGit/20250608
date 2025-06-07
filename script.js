// DOM 요소
const postForm = document.getElementById('postForm');
const postsContainer = document.getElementById('postsContainer');
const subjectSelect = document.getElementById('subjectSelect');
const postTemplate = document.getElementById('postTemplate');
const answerTemplate = document.getElementById('answerTemplate');

// Firebase 데이터베이스 참조 (firebase-config.js에서 초기화된 db 사용)
const postsCollection = db.collection('posts');

// 게시물 렌더링 함수
async function renderPosts(filteredPosts = null) {
    try {
        postsContainer.innerHTML = '<div class="loading">게시물을 불러오는 중...</div>';
        
        let query = postsCollection.orderBy('date', 'desc');
        if (filteredPosts === null) {
            const snapshot = await query.get();
            filteredPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        
        if (filteredPosts.length === 0) {
            postsContainer.innerHTML = '<div class="loading">등록된 게시물이 없습니다.</div>';
            return;
        }

        postsContainer.innerHTML = '';
        
        filteredPosts.forEach((post) => {
            const postElement = postTemplate.content.cloneNode(true);
            
            // 게시물 정보 설정
            postElement.querySelector('.subject').textContent = getSubjectName(post.subject);
            postElement.querySelector('.title').textContent = post.title;
            postElement.querySelector('.date').textContent = formatDate(post.date.toDate());
            postElement.querySelector('.post-content').textContent = post.content;
            
            // 답변 렌더링
            const answersContainer = postElement.querySelector('.answers-container');
            if (post.answers && post.answers.length > 0) {
                post.answers.forEach(answer => {
                    const answerElement = answerTemplate.content.cloneNode(true);
                    answerElement.querySelector('.answer-content').textContent = answer.content;
                    answerElement.querySelector('.answer-date').textContent = formatDate(answer.date.toDate());
                    answersContainer.appendChild(answerElement);
                });
            } else {
                answersContainer.innerHTML = '<div class="loading">아직 답변이 없습니다.</div>';
            }
            
            // 답변하기 버튼 이벤트 리스너
            const answerBtn = postElement.querySelector('.answer-btn');
            answerBtn.addEventListener('click', () => {
                const answerContent = prompt('답변을 입력하세요:');
                if (answerContent && answerContent.trim()) {
                    addAnswer(post.id, answerContent.trim());
                }
            });
            
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error rendering posts:', error);
        postsContainer.innerHTML = '<div class="loading">게시물을 불러오는 중 오류가 발생했습니다.</div>';
    }
}

// 새 게시물 추가 함수
async function addPost(subject, title, content) {
    try {
        const post = {
            subject,
            title: title.trim(),
            content: content.trim(),
            date: firebase.firestore.FieldValue.serverTimestamp(),
            answers: []
        };
        
        await postsCollection.add(post);
        postForm.reset();
    } catch (error) {
        console.error('Error adding post:', error);
        alert('게시물 등록 중 오류가 발생했습니다.');
    }
}

// 답변 추가 함수
async function addAnswer(postId, content) {
    try {
        const postRef = postsCollection.doc(postId);
        const answer = {
            content,
            date: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await postRef.update({
            answers: firebase.firestore.FieldValue.arrayUnion(answer)
        });
    } catch (error) {
        console.error('Error adding answer:', error);
        alert('답변 등록 중 오류가 발생했습니다.');
    }
}

// 교과목 이름 변환 함수
function getSubjectName(subjectCode) {
    const subjects = {
        'math': '수학',
        'science': '과학',
        'english': '영어',
        'korean': '국어'
    };
    return subjects[subjectCode] || subjectCode;
}

// 날짜 포맷 함수
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 이벤트 리스너
postForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const subject = document.getElementById('postSubject').value;
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    
    if (!subject) {
        alert('교과목을 선택해주세요.');
        return;
    }
    
    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }
    
    if (!content) {
        alert('내용을 입력해주세요.');
        return;
    }
    
    addPost(subject, title, content);
});

subjectSelect.addEventListener('change', async (e) => {
    const selectedSubject = e.target.value;
    try {
        let query = postsCollection.orderBy('date', 'desc');
        if (selectedSubject !== 'all') {
            query = query.where('subject', '==', selectedSubject);
        }
        
        const snapshot = await query.get();
        const filteredPosts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderPosts(filteredPosts);
    } catch (error) {
        console.error('Error filtering posts:', error);
        postsContainer.innerHTML = '<div class="loading">게시물 필터링 중 오류가 발생했습니다.</div>';
    }
});

// 실시간 업데이트 리스너
postsCollection.orderBy('date', 'desc').onSnapshot((snapshot) => {
    const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    renderPosts(posts);
}, (error) => {
    console.error('Error in real-time listener:', error);
    postsContainer.innerHTML = '<div class="loading">실시간 업데이트 중 오류가 발생했습니다.</div>';
});
