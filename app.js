document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addButton = document.getElementById('add-button');
    const todoList = document.getElementById('todo-list');
    const totalTodosElement = document.getElementById('total-todos');
    const completedTodosElement = document.getElementById('completed-todos');
    
    // localStorage에서 할일 목록 불러오기
    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    // 통계 업데이트 함수
    function updateStats() {
        const total = todos.length;
        const completed = todos.filter(todo => todo.completed).length;
        totalTodosElement.textContent = total;
        completedTodosElement.textContent = completed;
    }

    // 할일 목록 렌더링 함수
    function renderTodos() {
        todoList.innerHTML = '';
        if (todos.length === 0) {
            todoList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <p class="mt-2 text-sm">할일이 없습니다. 새로운 할일을 추가해보세요!</p>
                </div>
            `;
            updateStats();
            return;
        }

        todos.forEach((todo, index) => {
            const todoElement = document.createElement('div');
            todoElement.className = `
                group flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm
                hover:shadow-md transition-all duration-200
                ${todo.completed ? 'bg-gray-50' : ''}
            `;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = `
                w-5 h-5 rounded-md border-gray-300
                text-primary focus:ring-primary
                cursor-pointer transition-all duration-200
            `;
            checkbox.checked = todo.completed;

            const todoText = document.createElement('span');
            todoText.className = `
                flex-1 text-gray-700
                ${todo.completed ? 'line-through text-gray-400' : ''}
            `;
            todoText.textContent = todo.text;

            const deleteButton = document.createElement('button');
            deleteButton.className = `
                opacity-0 group-hover:opacity-100
                px-3 py-1.5 text-sm text-danger
                hover:bg-red-50 rounded-lg
                transition-all duration-200
            `;
            deleteButton.innerHTML = '삭제';

            todoElement.appendChild(checkbox);
            todoElement.appendChild(todoText);
            todoElement.appendChild(deleteButton);

            // 체크박스 이벤트
            checkbox.addEventListener('change', () => {
                todos[index].completed = !todos[index].completed;
                saveTodos();
                renderTodos();
            });

            // 삭제 버튼 이벤트
            deleteButton.addEventListener('click', () => {
                // 삭제 애니메이션
                todoElement.style.opacity = '0';
                todoElement.style.transform = 'translateX(10px)';
                setTimeout(() => {
                    todos.splice(index, 1);
                    saveTodos();
                    renderTodos();
                }, 200);
            });

            todoList.appendChild(todoElement);
        });

        updateStats();
    }

    // localStorage에 할일 목록 저장
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    // 할일 추가 함수
    function addTodo() {
        const text = todoInput.value.trim();
        if (text) {
            // 추가 애니메이션을 위한 임시 요소
            const tempTodo = {
                text: text,
                completed: false
            };
            todos.push(tempTodo);
            todoInput.value = '';
            saveTodos();
            renderTodos();

            // 입력 필드 포커스
            todoInput.focus();
        }
    }

    // 이벤트 리스너
    addButton.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    // 입력 필드 포커스 효과
    todoInput.addEventListener('focus', () => {
        todoInput.classList.add('ring-2', 'ring-primary');
    });

    todoInput.addEventListener('blur', () => {
        todoInput.classList.remove('ring-2', 'ring-primary');
    });

    // 초기 렌더링
    renderTodos();
}); 