const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { log } = require('console');
const dataFilePath = path.join(__dirname, 'data', 'records.json');

let mainWindow;
let addRecordWindow;
let addTodoWindow;
let editRecordWindow;
let editTodoWindow;
let tray;
// 初始化数据结构
let defaultData = {
  records: [],
  todos: [],
  goals: [
    { id: 'goal1', name: '目标1' }
  ]
};

// 获取所有目标
function getGoals() {
  let data = { goals: [] };
  if (fs.existsSync(dataFilePath)) {
    try {
      const dataContent = fs.readFileSync(dataFilePath, 'utf8');
      data = JSON.parse(dataContent);
    } catch (error) {
      console.error('解析数据文件时出错:', error);
    }
  }
  return data.goals || [];
}

// 添加新目标
function addGoal(goalName) {
  let data = defaultData;
  if (fs.existsSync(dataFilePath)) {
    try {
      const dataContent = fs.readFileSync(dataFilePath, 'utf8');
      data = JSON.parse(dataContent);
    } catch (error) {
      console.error('解析数据文件时出错:', error);
    }
  }

  const newGoal = {
    id: `goal${data.goals.length + 1}`,
    name: goalName
  };

  data.goals.push(newGoal);

  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    return newGoal;
  } catch (error) {
    console.error('写入数据文件时出错:', error);
    return null;
  }
}

// 删除目标
function deleteGoal(goalId) {
  let data = defaultData;
  if (fs.existsSync(dataFilePath)) {
    try {
      const dataContent = fs.readFileSync(dataFilePath, 'utf8');
      data = JSON.parse(dataContent);
    } catch (error) {
      console.error('解析数据文件时出错:', error);
    }
  }

  const index = data.goals.findIndex(g => g.id === goalId);
  if (index >= 0) {
    data.goals.splice(index, 1);
    
    // 更新关联记录的目标为"无"
    data.records.forEach(record => {
      if (record.goal === goalId) {
        record.goal = '';
      }
    });

    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('写入数据文件时出错:', error);
    }
  }
  return false;
}

function updateData(type, index, item) {
  console.log('尝试更新数据', type);
  console.log('index:', index);
  console.log('item:', item);
  let data = { records: [], todos: [] };
  if (fs.existsSync(dataFilePath)) {
    try {
      const dataContent = fs.readFileSync(dataFilePath, 'utf8');
      data = JSON.parse(dataContent);
    } catch (error) {
      console.error('解析数据文件时出错:', error);
      return; // 如果解析失败，直接返回
    }
  }

  if (type === 'record' && index >= 0 && index < data.records.length) {
    data.records[index] = item;
  } else if (type === 'todo' && index >= 0 && index < data.todos.length) {
    data.todos[index] = item;
  } else {
    console.error('无效的类型或索引:');
    return; // 如果索引无效，直接返回
  }

  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('数据更新成功');
  } catch (error) {
    console.error('写入数据文件时出错:', error);
  }
}

// 读取记录数据并发送到渲染进程
function sendDataToRenderer() {
  let data = defaultData;
  if (fs.existsSync(dataFilePath)) {
    try {
      const dataContent = fs.readFileSync(dataFilePath, 'utf8');
      data = JSON.parse(dataContent);
    } catch (error) {
      console.error('解析数据文件时出错:', error);
    }
  }
  mainWindow.webContents.send('receive-data', data);
}

function saveData({ record, todo }) {
  const dataDir = path.dirname(dataFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let data = { records: [], todos: [] };
  if (fs.existsSync(dataFilePath)) {
    try {
      const dataContent = fs.readFileSync(dataFilePath, 'utf8');
      data = JSON.parse(dataContent);
    } catch (error) {
      console.error('解析数据文件时出错:', error);
    }
  }

  if (record) {
    data.records.push(record);
  }
  if (todo) {
    data.todos.push(todo);
  }

  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
}

function deleteData(type, index) {
  let data = { records: [], todos: [] };
  if (fs.existsSync(dataFilePath)) {
    try {
      const dataContent = fs.readFileSync(dataFilePath, 'utf8');
      data = JSON.parse(dataContent);
    } catch (error) {
      console.error('解析数据文件时出错:', error);
    }
  }

  if (type === 'record' && index >= 0 && index < data.records.length) {
    data.records.splice(index, 1);
  } else if (type === 'todo' && index >= 0 && index < data.todos.length) {
    data.todos.splice(index, 1);
  }

  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 836,
    height: 549,
    frame: false,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  const menu = null;
  // 创建自定义菜单
  // const menu = Menu.buildFromTemplate([
  //   {
  //     label: 'File',
  //     submenu: [
  //       { label: 'New', accelerator: 'CmdOrCtrl+N' },
  //       { label: 'Open', accelerator: 'CmdOrCtrl+O' },
  //       { label: 'Save', accelerator: 'CmdOrCtrl+S' },
  //       { type: 'separator' },
  //       { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
  //     ]
  //   },
  //   {
  //     label: 'Edit',
  //     submenu: [
  //       { label: 'Undo', accelerator: 'CmdOrCtrl+Z' },
  //       { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z' },
  //       { type: 'separator' },
  //       { label: 'Cut', accelerator: 'CmdOrCtrl+X' },
  //       { label: 'Copy', accelerator: 'CmdOrCtrl+C' },
  //       { label: 'Paste', accelerator: 'CmdOrCtrl+V' }
  //     ]
  //   },
  //   {
  //     label: 'View',
  //     submenu: [
  //       { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
  //       { label: 'Toggle Developer Tools', accelerator: 'CmdOrCtrl+Shift+I', click: () => mainWindow.webContents.toggleDevTools() }
  //     ]
  //   },
  //   {
  //     label: 'About',
  //     submenu: [
  //       { label: 'to个人主页', click: () => { require('electron').shell.openExternal('https://ironname.top/') } }
  //     ]
  //   }
  // ]);

  Menu.setApplicationMenu(menu);

  // 窗口关闭时隐藏到托盘
  mainWindow.on('close', (event) => {
    app.quit();
    // if (!app.isQuitting) {
    //   event.preventDefault();
    //   mainWindow.hide();
    // }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 程序启动时读取数据
  mainWindow.webContents.on('did-finish-load', () => {
    sendDataToRenderer();
  });

}


function createAddRecordWindow() {
  addRecordWindow = new BrowserWindow({
    width: 400,
    height: 385,
    parent: mainWindow,
    modal: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  addRecordWindow.loadFile(path.join(__dirname, 'SubWindows', 'add_record.html'));
}

function createAddTodoWindow() {
  addTodoWindow = new BrowserWindow({
    width: 400,
    height: 300,
    parent: mainWindow,
    modal: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  addTodoWindow.loadFile(path.join(__dirname, 'SubWindows', 'add_todo.html'));
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏', click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      }
    },
    {
      label: '退出', click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function openRecordEditWindow(index, record) {
  if (!editRecordWindow) {
    editRecordWindow = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      show: false,
      frame: false,
      width: 400,
      height: 385,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    editRecordWindow.loadFile(path.join(__dirname, 'SubWindows', 'edit_record.html'));

    editRecordWindow.on('closed', () => {
      editRecordWindow = null;
    });

    editRecordWindow.once('ready-to-show', () => {
      editRecordWindow.webContents.send('edit-record', { index, record });
      editRecordWindow.show();
    });
  } else {
    editRecordWindow.focus();
  }
}

function openTodoEditWindow(index, todo) {
  if (!editTodoWindow) {
    editTodoWindow = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      show: false,
      frame: false,
      width: 400,
      height: 300,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    editTodoWindow.loadFile(path.join(__dirname, 'SubWindows', 'edit_todo.html'));

    editTodoWindow.on('closed', () => {
      editTodoWindow = null;
    });

    editTodoWindow.once('ready-to-show', () => {
      editTodoWindow.webContents.send('edit-todo', { index, todo });
      editTodoWindow.show();
    });
  } else {
    editTodoWindow.focus();
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  // 功能做完前先不管托盘
  
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 目标相关IPC处理
ipcMain.on('get-goals', (event) => {
  event.reply('receive-goals', getGoals());
});

ipcMain.on('add-goal', (event, goalName) => {
  const newGoal = addGoal(goalName);
  event.reply('add-goal-result', newGoal);
});

ipcMain.on('delete-goal-by-name', (event, goalName) => {
  const success = deleteGoalByName(goalName); // 需要实现这个函数
  event.reply('delete-goal-result', success);
});

// 新增根据名称删除目标的函数
function deleteGoalByName(goalName) {
  let data = defaultData;
  if (fs.existsSync(dataFilePath)) {
    try {
      const dataContent = fs.readFileSync(dataFilePath, 'utf8');
      data = JSON.parse(dataContent);
    } catch (error) {
      console.error('解析数据文件时出错:', error);
      return false;
    }
  }

  const index = data.goals.findIndex(g => g.name === goalName);
  if (index >= 0) {
    const goalId = data.goals[index].id;
    data.goals.splice(index, 1);
    
    // 更新关联记录的目标为"无"
    data.records.forEach(record => {
      if (record.goal === goalId) {
        record.goal = '';
      }
    });

    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('写入数据文件时出错:', error);
    }
  }
  return false;
}

ipcMain.on('update-record', (event, { index, record }) => {
  // console.log('index:', index);
  updateData('record', index, record);
  mainWindow.webContents.send('item-deleted'); // 通知渲染进程数据已更新
});

ipcMain.on('update-todo', (event, { index, todo }) => {
  updateData('todo', index, todo);
  mainWindow.webContents.send('item-deleted'); // 通知渲染进程数据已更新
});

ipcMain.on('open-record-edit-window', (event, { index, record }) => {
  // console.log('index:', index);
  openRecordEditWindow(index, record);
});

ipcMain.on('open-todo-edit-window', (event, { index, todo }) => {
  openTodoEditWindow(index, todo);
});


ipcMain.on('delete-item', (event, { type, index }) => {
  // console.log('删除数据:', type, index);
  deleteData(type, index);
  mainWindow.webContents.send('item-deleted');
});

ipcMain.on('request-data', () => {
  sendDataToRenderer();
});

ipcMain.on('save-record', (event, record) => {
  console.log('保存记录:', record);
  saveData({ record });
  sendDataToRenderer(); // 保存后更新数据
});

ipcMain.on('save-todo', (event, todo) => {
  console.log('保存待办:', todo);
  saveData({ todo });
  sendDataToRenderer(); // 保存后更新数据
});

ipcMain.on('open-add-todo-window', () => {
  createAddTodoWindow();
});

ipcMain.on('close-edit-todo-window', () => {
  if (editTodoWindow) {
    editTodoWindow.close();
  }
});

ipcMain.on('close-edit-record-window', () => {
  if (editRecordWindow) {
    editRecordWindow.close();
  }
});

ipcMain.on('close-add-todo-window', () => {
  if (addTodoWindow) {
    addTodoWindow.close();
  }
});

ipcMain.on('open-add-record-window', () => {
  createAddRecordWindow();
});

ipcMain.on('close-add-record-window', () => {
  if (addRecordWindow) {
    addRecordWindow.close();
  }
});

ipcMain.on('add-record', (event, record) => {
  addPracticeRecord(record);
  event.reply('records-updated', getPracticeRecords());
  addRecordWindow.close();
});

// 监听移动窗口的IPC消息
ipcMain.on('move-window', (event, dx, dy) => {
   const { x, y } = mainWindow.getBounds();
  //  console.log("move to ", x + dx, y + dy)
   mainWindow.setPosition(x + dx, y + dy);
});

ipcMain.on('close-window', () => {
  // mainWindow.close();
  mainWindow.hide();
});
