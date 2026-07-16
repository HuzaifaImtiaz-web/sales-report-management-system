const { Menu, app, dialog } = require('electron');

function setCustomMenu(mainWindow) {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Data (Placeholder)',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'File',
              message: 'Export Data action triggered (placeholder).'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Options (Placeholder)',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Tools',
              message: 'Options dialog action triggered (placeholder).'
            });
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Himmel Sales Management',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'Himmel Sales Management\nVersion 1.0.0\nHimmel Pharmaceutical'
            });
          }
        }
      ]
    }
  ];

  if (isDev) {
    template[1].submenu.push(
      { type: 'separator' },
      {
        label: 'Toggle Developer Tools',
        accelerator: 'F12',
        click: () => {
          mainWindow.webContents.toggleDevTools();
        }
      },
      {
        label: 'Force Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          mainWindow.webContents.reloadIgnoringCache();
        }
      }
    );
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = {
  setCustomMenu
};
