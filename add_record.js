const { ipcRenderer } = require('electron');

document.getElementById('addRecordForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const content = document.getElementById('content').value;
  const duration = document.getElementById('duration').value;
  const record = {
    date: new Date().toISOString(),
    content,
    duration
  };
  ipcRenderer.send('add-record', record);
});