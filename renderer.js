document.getElementById('addTaskButton').addEventListener('click', () => {
  const taskList = document.getElementById('taskList');
  const taskItem = document.createElement('li');
  taskItem.textContent = 'New Task';
  taskList.appendChild(taskItem);
});

document.getElementById('addRecordButton').addEventListener('click', () => {
  const list = document.getElementById('recordList');
  const item = document.createElement('li');
  item.textContent = 'New Record';
  list.appendChild(item);
});