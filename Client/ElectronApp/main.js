const {app, BrowserWindow} = require('electron')
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
const spawn = require('child_process').spawn
const util = require('util')

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

    win.webContents.session.setProxy({
        proxyRules:"edgepi01:3000"
    }, function () {
        // and load the index.html of the app. 
        win.loadURL(`file://${__dirname}/index.html`)
    });
    
//    win.loadURL(`file://${__dirname}/index.html`)

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

ipc.on('execute-voicerecognition-script', function(event) {
    executeVoiceRecognition(event, 'receive-voice-translation');
});

ipc.on('execute-voicerecognition-script-experiment', function(event) {
    executeVoiceRecognition(event, 'receive-voice-translation-experiment');
});

function executeVoiceRecognition(event, eventName) {
	var childProcessResponse = "";
    
    var ls = spawn('sh', ['./SH/ProcessVoiceFile.sh']);
    
    ls.stdout.on('data', function(data) {
        //childProcessResponse += 'stdout: ' + data;
        childProcessResponse += data;
    });
    
    ls.stderr.on('data', function (data) {
        //childProcessResponse += 'stderr: ' + data;
    });

    ls.on('exit', function (code) {
        //childProcessResponse += 'exit: ' + code;
        event.sender.send(eventName, childProcessResponse);
    });
}