const {ipcRenderer } = require('electron');

const goalList = document.getElementById('goalList');

document.getElementById('addGoalButton').addEventListener('click', () => {
  ipcRenderer.send('open-add-goal-window');
});

document.getElementById('close-button').addEventListener('click', () => {
  ipcRenderer.send('close-manage-goal-window');
});

ipcRenderer.on('receive-data', (event, goals) => {
  goalList.innerHTML = '';

  goals.forEach((goal, index) => {
    const listItem = document.createElement('li');
    const goalSpan = document.createElement('span');
    goalSpan.className = 'info-box goal-box';
    goalSpan.textContent = `${goal.name}`;

    listItem.appendChild(goalSpan);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    const editButton = document.createElement('button');
    editButton.textContent = '编辑';
    editButton.className='edit-button'
    editButton.addEventListener('click', () => {
        ipcRenderer.send('open-edit-goal-window', { 
        index, 
        goal
        });
    });
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '删除';
    deleteButton.className='delete-button'
    deleteButton.addEventListener('click', () => {
      confirmDelete('goal', 
        index
      );
    });
    
    buttonContainer.appendChild(editButton);
    if(goal.id != 'goal0')
      buttonContainer.appendChild(deleteButton);
    listItem.appendChild(buttonContainer);
    goalList.appendChild(listItem);
  })
});

function confirmDelete(type, index) {
  const result = confirm('是否确认删除这项数据？');
  if (result) {
    ipcRenderer.send('delete-item', { type, index });
  }
}