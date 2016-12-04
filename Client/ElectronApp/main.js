const {app, BrowserWindow} = require('electron')
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () 
{
    //Create the browser window.
    win = new BrowserWindow(
    {
        frame: false,
        fullscreen: true
    })

    win.webContents.session.setProxy(
        {
            proxyRules:"edgepi01:3000"
        }, function () {
        // and load the index.html of the app. 
    
        win.loadURL(`file://${__dirname}/index.html`)
    });

    //If I need to debug I will use this
    //win.webContents.openDevTools()

    win.on('closed', () => {
        win = null
      })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipc.on('open-information-dialog', function(event) {
	const options = {
		type: 'info',
		title: 'Information',
		message: "This is my test dialog that discribes communication between the server process and the client process, you like?",
		buttons: ['Yes','No']
	}
	dialog.showMessageBox(options, function(index) {
		event.sender.send('information-dialog-selection',index)
	})
})