document.addEventListener('DOMContentLoaded', function() {
    const employeesBody = document.getElementById('employeesBody');
    const addEmployeeForm = document.getElementById('addEmployeeForm');
    
    // Функция для показа уведомлений
    function showAlert(message, isSuccess = true) {
        const alert = document.createElement('div');
        alert.className = `alert ${isSuccess ? 'success' : 'error'}`;
        alert.textContent = message;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }

    // Загрузка сотрудников
    async function loadEmployees() {
        try {
            const response = await fetch('/api/employees');
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных');
            }
            
            const data = await response.json();
            employeesBody.innerHTML = '';
            
            data.forEach(employee => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${employee.id}</td>
                    <td>${employee.first_name}</td>
                    <td>${employee.last_name}</td>
                    <td>${employee.phone}</td>
                    <td>${employee.email}</td>
                    <td>${employee.login}</td>
                    <td>${employee.created_at}</td>
                    <td>
                        <button class="delete" onclick="deleteEmployee(${employee.id})">Удалить</button>
                    </td>
                `;
                employeesBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error:', error);
            showAlert('Ошибка загрузки данных', false);
        }
    }
    
    // Добавление сотрудника
    addEmployeeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const employee = {
            first_name: document.getElementById('firstName').value.trim(),
            last_name: document.getElementById('lastName').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            login: document.getElementById('login').value.trim()
        };
        
        // Валидация
        if (!employee.first_name || !employee.last_name || !employee.phone || !employee.email || !employee.login) {
            showAlert('Заполните все поля!', false);
            return;
        }
        
        try {
            const response = await fetch('/api/employees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(employee)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка сервера');
            }
            
            await loadEmployees();
            addEmployeeForm.reset();
            showAlert('Сотрудник успешно добавлен!');
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message, false);
        }
    });
    
    // Удаление сотрудника
    window.deleteEmployee = async function(id) {
        if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;
        
        try {
            const response = await fetch(`/api/employees/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Ошибка при удалении');
            }
            
            await loadEmployees();
            showAlert('Сотрудник удалён');
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message, false);
        }
    };
    
    // Первоначальная загрузка
    loadEmployees();
});