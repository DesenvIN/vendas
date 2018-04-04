const {app, BrowserWindow, ipcMain} = require('electron')
const {ipcRenderer} = require('electron');
const path = require('path')
const url = require('url')
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");

let win
let sobreWindow = null;

function sendStatusToWindow(text) {
	log.info(text);
	win.webContents.send('message', text);
}

function Atualizacao() {
	// win.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);
	win.loadURL(
		url.format({
			// pathname: path.join('www.ingressonacional.com.br/pdvdev/'),
			pathname: path.join('pdv.local/pdv/atualizacao.html'),
			protocol: 'http:'
		})
		)
	return win;
}

function CriarTela() {
	win = new BrowserWindow();
	win.maximize()
	win.show()
	// win.webContents.openDevTools();
	win.on('closed', () => {
		win = null;
	});
	return win;
}

function AbrirSistema () {
	win.loadURL(
		url.format({
			// pathname: path.join('www.ingressonacional.com.br/pdvdev/'),
			pathname: path.join('pdv.local/pdv/'),
			protocol: 'http:'
		})
		)
}

app.on('ready', function()  {
	CriarTela();
	autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('checking-for-update', () => {
	sendStatusToWindow('Checking for update...');
})

autoUpdater.on('update-available', (info) => {
  // sendStatusToWindow('Update available.');
  Atualizacao();
})

autoUpdater.on('update-not-available', (info) => {
  // sendStatusToWindow('Update not available.');
  AbrirSistema();
})

autoUpdater.on('error', (err) => {
	sendStatusToWindow('Error in auto-updater. ' + err);
})

autoUpdater.on('download-progress', (progressObj) => {
	let log_message = "Download speed: " + progressObj.bytesPerSecond;
	log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
	log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
	sendStatusToWindow(log_message);
})

autoUpdater.on('update-downloaded', (info) => {
	sendStatusToWindow('Update downloaded');
})

autoUpdater.on('update-downloaded', (info) => {
	autoUpdater.quitAndInstall();  
});

ipcMain.on('imprimir', (event) =>{
	win.webContents.print({silent: true, deviceName: 'INacional'});
});

ipcMain.on('imprimirIngressos', (event, item, contador) =>{
	let impressora = {'status': 999};
	var contadorVerificacao = 0;
	while(impressora.status != 0 && contadorVerificacao < 10){
		let retornoImpressora = win.webContents.getPrinters();
		contadorVerificacao++;
		for (var i = 0; i < retornoImpressora.length; i++) {
			if(retornoImpressora[i].name == 'INacional'){
				impressora = retornoImpressora[i];
			}
		}
	}
	if(impressora.status == 0){
		win.webContents.print({silent: true, deviceName: 'INacional'}, function (success) {
			if(success){
				if(item){
					if(item.IngressoImpresso == 'N'){
						item.IngressoImpresso = 'S';
					} else if(item.IngressoImpresso == 'S' && item.reciboImpresso == 'N'){
						item.reciboImpresso = 'S';
					}
				}
				var anterior = contador;
				contador++;
				event.sender.send('retornoImpressaoSucesso', item, anterior, contador);
			} else {
				event.sender.send('retornoImpressaoErro', item);
			}
		});
	} else if(impressora.status == 999){
		event.sender.send('retornoSemImpressora');
	} else {
		event.sender.send('retornoImpressoraErro');
	}
});

ipcMain.on('imprimirComprovante', (event) =>{
	let impressora = {'status': 999};
	var contadorVerificacao = 0;
	while(impressora.status != 0 && contadorVerificacao < 10){
		let retornoImpressora = win.webContents.getPrinters();
		contadorVerificacao++;
		for (var i = 0; i < retornoImpressora.length; i++) {
			if(retornoImpressora[i].name == 'INacional'){
				impressora = retornoImpressora[i];
			}
		}
	}
	if(impressora.status == 0){
		win.webContents.print({silent: true, deviceName: 'INacional'}, function (success) {
			if(success){
				event.sender.send('retornoImpressaoComprovanteSucesso');
			} else {
				event.sender.send('retornoImpressaoErro', item);
			}
		});
	} else if(impressora.status == 999){
		event.sender.send('retornoSemImpressora');
	} else {
		event.sender.send('retornoImpressoraErro', 'comprovante');
	}
});