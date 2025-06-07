// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyADXDOya0ZZUUsaEaFtBwRx5o-MbahYD8E",
    authDomain: "javabeen-2d639.firebaseapp.com",
    projectId: "javabeen-2d639",
    storageBucket: "javabeen-2d639.firebasestorage.app",
    messagingSenderId: "108648561242",
    appId: "1:108648561242:web:8ade5fe3b9b330f92ff663"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore 데이터베이스 참조
const db = firebase.firestore(); 