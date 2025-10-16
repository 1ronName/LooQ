const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { log } = require('console');
const dataFilePath = path.join(__dirname, 'data', 'records.json');

let mainWindow;
let addRecordWindow;
let tray;

// 读取记录数据并发送到渲染进程
function sendRecordsToRenderer() {
  let records = [];
  if (fs.existsSync(dataFilePath)) {
    try {
      const recordsData = fs.readFileSync(dataFilePath, 'utf8');
      records = JSON.parse(recordsData);
    } catch (error) {
      console.error('解析记录文件时出错:', error);
    }
  }
  mainWindow.webContents.send('receive-records', records);
}

function saveRecord(record) {
  // 确保 data 目录存在
  const dataDir = path.dirname(dataFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 读取现有记录
  let records = [];
  if (fs.existsSync(dataFilePath)) {
    try {
      const recordsData = fs.readFileSync(dataFilePath, 'utf8');
      records = JSON.parse(recordsData);
    } catch (error) {
      console.error('解析记录文件时出错:', error);
      // 如果文件内容不是有效的 JSON，记录为空数组
      records = [];
    }
  }

  // 添加新记录
  records.push(record);

  // 保存记录
  fs.writeFileSync(dataFilePath, JSON.stringify(records, null, 2), 'utf8');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 740,
    height: 480,
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

  // 程序启动时读取记录数据
  mainWindow.webContents.on('did-finish-load', () => {
  sendRecordsToRenderer();
});
}

function createAddRecordWindow() {
  addRecordWindow = new BrowserWindow({
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

  addRecordWindow.loadFile('add_record.html');
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show', click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Quit', click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  createWindow();
  // createTray();
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

ipcMain.on('request-records', () => {
  sendRecordsToRenderer();
});

ipcMain.on('save-record', (event, data) => {
  saveRecord(data);
  sendRecordsToRenderer(); 
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
  mainWindow.close();
});
