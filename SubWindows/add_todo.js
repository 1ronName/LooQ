const { ipcRenderer } = require('electron');

// 获取当前时间并格式化为YYYY-MM-DDTHH:mm格式
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');

// 设置日期时间输入框的默认值为当前时间
document.getElementById('dateTime').value = `${year}-${month}-${day}T${hours}:${minutes}`;

document.getElementById('cancelButton').addEventListener('click', () => {
    ipcRenderer.send('close-add-todo-window');
});

document.getElementById('addTodoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    // 获取表单数据
    const formData = new FormData(e.target);
    const content = formData.get('content');
    const dateTime = formData.get('dateTime'); // 获取完整日期时间
    
    // 将日期时间格式化为更易读的形式
    const formattedDateTime = formatDateTime(dateTime);
    
    // 发送数据到主进程
    ipcRenderer.send('save-todo', { 
        content, 
        date: formattedDateTime // 使用格式化后的日期时间
    });
    ipcRenderer.send('close-add-todo-window');
});
// 格式化日期时间函数
function formatDateTime(dateTimeString) {
    const [datePart, timePart] = dateTimeString.split('T');
    const [hours, minutes] = timePart.split(':');
    return `${datePart} ${hours}:${minutes}`;
}