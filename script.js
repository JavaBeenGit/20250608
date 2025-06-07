// DOM 요소
const authContainer = document.getElementById('authContainer');
const authForms = document.getElementById('authForms');
const postForm = document.getElementById('postForm');
const questionForm = document.getElementById('questionForm');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const postsContainer = document.getElementById('postsContainer');
const subjectSelect = document.getElementById('subjectSelect');
const postTemplate = document.getElementById('postTemplate');
const answerTemplate = document.getElementById('answerTemplate');

// Firebase 인증 및 데이터베이스 참조
const auth = firebase.auth();
const db = firebase.firestore();
const postsCollection = db.collection('posts');

// 현재 로그인한 사용자 정보
let currentUser = null;

// 인증 상태 변경 감지
auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateAuthUI();
    renderPosts();
});

// 인증 UI 업데이트
function updateAuthUI() {
    if (currentUser) {
        // 로그인 상태
        authContainer.innerHTML = `
            <span>${currentUser.email}</span>
            <button onclick="logout()">로그아웃</button>
        `;
        authForms.style.display = 'none';
        postForm.style.display = 'block';
        // 에러 메시지 초기화
        loginError.textContent = '';
        signupError.textContent = '';
    } else {
        // 로그아웃 상태
        authContainer.innerHTML = `
            <button onclick="showAuthForms()">로그인/회원가입</button>
        `;
        authForms.style.display = 'flex';
        postForm.style.display = 'none';
    }
}

// 로그인/회원가입 폼 표시
function showAuthForms() {
    authForms.style.display = 'flex';
    // 에러 메시지 초기화
    loginError.textContent = '';
    signupError.textContent = '';
}

// 로그인
async function login(email, password) {
    try {
        loginError.textContent = '';
        await auth.signInWithEmailAndPassword(email, password);
        authForms.style.display = 'none';
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = getAuthErrorMessage(error.code);
    }
}

// 회원가입
async function signup(email, password) {
    try {
        signupError.textContent = '';
        await auth.createUserWithEmailAndPassword(email, password);
        authForms.style.display = 'none';
    } catch (error) {
        console.error('Signup error:', error);
        signupError.textContent = getAuthErrorMessage(error.code);
    }
}

// 로그아웃
async function logout() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
        alert('로그아웃 중 오류가 발생했습니다: ' + error.message);
    }
}

// Firebase 인증 에러 메시지 변환
function getAuthErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': '유효하지 않은 이메일 주소입니다.',
        'auth/user-disabled': '비활성화된 계정입니다.',
        'auth/user-not-found': '등록되지 않은 이메일입니다.',
        'auth/wrong-password': '잘못된 비밀번호입니다.',
        'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
        'auth/weak-password': '비밀번호가 너무 약합니다.',
        'auth/operation-not-allowed': '허용되지 않은 작업입니다.',
        'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
    };
    return errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.';
}

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
            postElement.querySelector('.author').textContent = post.authorEmail;
            postElement.querySelector('.date').textContent = formatDate(post.date.toDate());
            postElement.querySelector('.post-content').textContent = post.content;
            
            // 삭제 버튼 표시 (작성자인 경우에만)
            const deleteBtn = postElement.querySelector('.delete-btn');
            if (currentUser && post.authorId === currentUser.uid) {
                deleteBtn.style.display = 'block';
                deleteBtn.addEventListener('click', () => deletePost(post.id));
            }
            
            // 답변 렌더링
            const answersContainer = postElement.querySelector('.answers-container');
            if (post.answers && post.answers.length > 0) {
                post.answers.forEach(answer => {
                    const answerElement = answerTemplate.content.cloneNode(true);
                    answerElement.querySelector('.answer-content').textContent = answer.content;
                    answerElement.querySelector('.answer-author').textContent = answer.authorEmail;
                    answerElement.querySelector('.answer-date').textContent = formatDate(answer.date.toDate());
                    
                    // 답변 삭제 버튼 표시 (작성자인 경우에만)
                    const deleteAnswerBtn = answerElement.querySelector('.delete-answer-btn');
                    if (currentUser && answer.authorId === currentUser.uid) {
                        deleteAnswerBtn.style.display = 'block';
                        deleteAnswerBtn.addEventListener('click', () => deleteAnswer(post.id, answer));
                    }
                    
                    answersContainer.appendChild(answerElement);
                });
            } else {
                answersContainer.innerHTML = '<div class="loading">아직 답변이 없습니다.</div>';
            }
            
            // 답변하기 버튼 이벤트 리스너 (로그인한 경우에만)
            const answerBtn = postElement.querySelector('.answer-btn');
            if (currentUser) {
                answerBtn.addEventListener('click', () => {
                    const answerContent = prompt('답변을 입력하세요:');
                    if (answerContent && answerContent.trim()) {
                        addAnswer(post.id, answerContent.trim());
                    }
                });
            } else {
                answerBtn.disabled = true;
                answerBtn.textContent = '로그인 후 답변 가능';
            }
            
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error rendering posts:', error);
        postsContainer.innerHTML = '<div class="loading">게시물을 불러오는 중 오류가 발생했습니다.</div>';
    }
}

// 새 게시물 추가 함수
async function addPost(subject, title, content) {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }

    try {
        const post = {
            subject,
            title: title.trim(),
            content: content.trim(),
            authorId: currentUser.uid,
            authorEmail: currentUser.email,
            date: firebase.firestore.FieldValue.serverTimestamp(),
            answers: []
        };
        
        await postsCollection.add(post);
        questionForm.reset();
    } catch (error) {
        console.error('Error adding post:', error);
        alert('게시물 등록 중 오류가 발생했습니다.');
    }
}

// 게시물 삭제 함수
async function deletePost(postId) {
    if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) return;

    try {
        await postsCollection.doc(postId).delete();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('게시물 삭제 중 오류가 발생했습니다.');
    }
}

// 답변 추가 함수
async function addAnswer(postId, content) {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }

    try {
        const postRef = postsCollection.doc(postId);
        const answer = {
            content,
            authorId: currentUser.uid,
            authorEmail: currentUser.email,
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

// 답변 삭제 함수
async function deleteAnswer(postId, answer) {
    if (!confirm('정말로 이 답변을 삭제하시겠습니까?')) return;

    try {
        const postRef = postsCollection.doc(postId);
        await postRef.update({
            answers: firebase.firestore.FieldValue.arrayRemove(answer)
        });
    } catch (error) {
        console.error('Error deleting answer:', error);
        alert('답변 삭제 중 오류가 발생했습니다.');
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
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (email && password) {
        login(email, password);
    }
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    
    if (password !== passwordConfirm) {
        signupError.textContent = '비밀번호가 일치하지 않습니다.';
        return;
    }
    
    if (password.length < 6) {
        signupError.textContent = '비밀번호는 6자 이상이어야 합니다.';
        return;
    }
    
    if (email && password) {
        signup(email, password);
    }
});

questionForm.addEventListener('submit', (e) => {
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
