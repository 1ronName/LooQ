const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { log } = require('console');
const dataFilePath = path.join(__dirname, 'data', 'records.json');

//--------------自动启动设置相关----------------//
const AutoLaunch = require('auto-launch');

// 创建自动启动实例
const appLauncher = new AutoLaunch({
  name: 'LooQ-打卡与提醒',
  path: app.getPath('exe')
});

// 获取自动启动设置
ipcMain.handle('get-auto-start-setting', async () => {
  return await appLauncher.isEnabled();
});

// 设置自动启动
ipcMain.on('set-auto-start-setting', async (event, enabled) => {
  try {
    if (enabled) {
      await appLauncher.enable();
    } else {
      await appLauncher.disable();
    }
    console.log('自动启动设置已更新:', enabled);
  } catch (error) {
    console.error('更新自动启动设置失败:', error);
  }
});

//--------------数据存储更新相关----------------//
// 初始化数据结构
let dataBuffer = {
  records: [],
  todos: [],
  goals: []
};

function updateData(type, index, item) {
  console.log('尝试更新数据', type);
  console.log('index:', index);
  console.log('item:', item);
  let data = { records: [], todos: [], goals: [] };
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
  } else if (type === 'goal' && index >= 0 && index < data.goals.length) {
    data.goals[index] = item;
    if(goalManageWindow){
      goalManageWindow.webContents.send('receive-data', data.goals);
    }
  } else {
    console.error('无效的类型或索引:');
    return; // 如果索引无效，直接返回
  }

  dataBuffer = data;
  sendDataToRenderer();

  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('数据更新成功');
  } catch (error) {
    console.error('写入数据文件时出错:', error);
  }
}

// 读取记录数据并发送到渲染进程
function sendDataToRenderer() {
  let data = dataBuffer;
  if (fs.existsSync(dataFilePath)) {
    try {
      const dataContent = fs.readFileSync(dataFilePath, 'utf8');
      data = JSON.parse(dataContent);
    } catch (error) {
      console.error('解析数据文件时出错:', error);
    }
  }
  dataBuffer = data;
  mainWindow.webContents.send('receive-data', data);
}

function saveData({ record, todo, goal }) {
  const dataDir = path.dirname(dataFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let data = { records: [], todos: [], goal: [] };
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
  if(goal){
    data.goals.push(goal);
    if(goalManageWindow){
      goalManageWindow.webContents.send('receive-data', data.goals);
    }
  }

  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
}

function deleteData(type, index) {
  let data = { records: [], todos: [], goals:[] };
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
  } else if (type === 'goal' && index >= 0 && index < data.goals.length) {
    //属于此目标的设为goal0
    data.records.forEach((record, r_index)=>{
      if(record.goal == data.goals[index].id){
        record.goal = 'goal0';
        updateData('record', r_index, record);
      }
    });
    data.goals.splice(index, 1);
    if(goalManageWindow){
      goalManageWindow.webContents.send('receive-data', data.goals);
    }
    sendDataToRenderer();
  }

  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
}

//--------------创建窗口相关----------------//
let mainWindow;
let addRecordWindow;
let addTodoWindow;
let editRecordWindow;
let editTodoWindow;
let goalManageWindow;
let addGoalWindow;
let editGoalWindow;
let tray;

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

function changeSettingsWindow(){
  mainWindow.loadFile('settings.html');
}

function changeMainWindow(){
  mainWindow.loadFile('index.html');
}


function createGoalManageWindow(){
  goalManageWindow = new BrowserWindow({
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

  goalManageWindow.loadFile(path.join(__dirname, 'SubWindows', 'manage_goals.html'));

  goalManageWindow.once('ready-to-show', () => {
      goalManageWindow.webContents.send('receive-data',  dataBuffer.goals );
      goalManageWindow.show();
    });
}

function createAddGoalWindow(){
  addGoalWindow = new BrowserWindow({
    width: 400,
    height: 385,
    parent: goalManageWindow,
    modal: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  addGoalWindow.loadFile(path.join(__dirname, 'SubWindows', 'add_goal.html'));

  addGoalWindow.once('ready-to-show', () => {
      addGoalWindow.webContents.send('add-goal',  dataBuffer.goals);
      addGoalWindow.show();
    });
}

function openEditGoalWindow(index, goal){
  if (!editGoalWindow) {
    editGoalWindow = new BrowserWindow({
      parent: goalManageWindow,
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

    editGoalWindow.loadFile(path.join(__dirname, 'SubWindows', 'edit_goal.html'));

    editGoalWindow.on('closed', () => {
      editGoalWindow = null;
    });

    editGoalWindow.once('ready-to-show', () => {
      editGoalWindow.webContents.send('edit-goal', { index, goal });
      editGoalWindow.show();
    });
  } else {
    editGoalWindow.focus();
  }
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

  addRecordWindow.once('ready-to-show', () => {
      addRecordWindow.webContents.send('add-record',  dataBuffer.goals );
      addRecordWindow.show();
    });
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

function openRecordEditWindow(index, record, goals) {
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
      editRecordWindow.webContents.send('edit-record', { index, record, goals });
      editRecordWindow.show();
      // console.log('修改项信息', record);
      // console.log('goal列表', goals);
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

ipcMain.on('change-settings-window', () => {
  changeSettingsWindow();
});

ipcMain.on('change-main-window', () => {
  changeMainWindow();
});

ipcMain.on('open-add-goal-window', () => {
  console.log('>>>open the add goalwindow');
  createAddGoalWindow();
});

ipcMain.on('open-edit-goal-window', (event, {index, goal}) => {
  // console.log('index:', index);
  openEditGoalWindow(index, goal);
});

ipcMain.on('open-goal-manage-window', () => {
  console.log('>>>open the goal manage window');
  createGoalManageWindow();
});

ipcMain.on('update-record', (event, { index, record }) => {
  // console.log('index:', index);
  updateData('record', index, record);
  mainWindow.webContents.send('item-deleted'); // 通知渲染进程数据已更新
});

ipcMain.on('update-todo', (event, { index, todo }) => {
  updateData('todo', index, todo);
  mainWindow.webContents.send('item-deleted'); // 通知渲染进程数据已更新
});

ipcMain.on('update-goal', (event, { index, goal }) => {
  updateData('goal', index, goal);
  mainWindow.webContents.send('item-deleted'); // 通知渲染进程数据已更新
});

ipcMain.on('open-record-edit-window', (event, { index, record }) => {
  // console.log('index:', index);
  openRecordEditWindow(index, record, dataBuffer.goals);
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

ipcMain.on('save-goal', (event, goal) => {
  console.log('保存目标:', goal);
  saveData({ goal });
  sendDataToRenderer(); // 保存后更新数据
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

ipcMain.on('close-manage-goal-window', () => {
  if (goalManageWindow) {
    goalManageWindow.close();
  }
});

ipcMain.on('close-add-goal-window', () => {
  if (addGoalWindow) {
    addGoalWindow.close();
  }
});

ipcMain.on('close-edit-goal-window', () => {
  if (editGoalWindow) {
    editGoalWindow.close();
  }
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
