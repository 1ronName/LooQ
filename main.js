const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { log } = require('console');
const dataFilePath = path.join(__dirname, 'data', 'records.json');

let mainWindow;
let tray;

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
}

function createAddRecordWindow() {
  addRecordWindow = new BrowserWindow({
    width: 400,
    height: 300,
    parent: mainWindow,
    modal: true,
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

ipcMain.on('open-add-record-window', () => {
  createAddRecordWindow();
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
  console.log('Closed.');
  mainWindow.close();
});
