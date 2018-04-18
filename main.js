/*
**  Nuxt 설정
*/
const http = require('http')
const { Nuxt, Builder } = require('nuxt')
let config = require('./nuxt.config.js')
config.rootDir = __dirname // for electron-builder

const nuxt = new Nuxt(config)
const server = http.createServer(nuxt.render)

if (config.dev) {
  const builder = new Builder(nuxt)
	builder.build().catch(err => {
		console.error(err)
		process.exit(1)
	})
}

server.listen()
const _NUXT_URL_ = `http://localhost:${server.address().port}`
console.log(`Nuxt working on ${_NUXT_URL_}`)

/*
** Electron 설정
*/
const setupEvents = require('./squirrel')
if (setupEvents.handleSquirrelEvent()) {
   // squirrel event handled and app will exit in 1000ms, so don't do anything else
   return;
}

let win = null
const electron = require('electron')
const path = require('path')
const app = electron.app
const newWin = () => {
	win = new electron.BrowserWindow({
    icon: path.join(__dirname, 'static/icon.png'),
    show: false
	})
	win.maximize()
	win.on('closed', () => win = null)
	if (config.dev) {
		// 개발 도구 설치
		const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer')
		installExtension(VUEJS_DEVTOOLS.id).then(name => {
			console.log(`Added Extension:  ${name}`)
			win.webContents.openDevTools()
		}).catch(err => console.log('An error occurred: ', err))
		// 300ms 마다 nuxt 서버를 확인하고 연결
		const pollServer = () => {
			http.get(_NUXT_URL_, (res) => {
				if (res.statusCode === 200) {
          win.loadURL(_NUXT_URL_)
          win.show()
        } else { setTimeout(pollServer, 300) }
			}).on('error', pollServer)
		}
		pollServer()
	} else {
    win.loadURL(_NUXT_URL_)
    win.show()
  }
}
app.on('ready', newWin)
app.on('window-all-closed', () => app.quit())
app.on('activate', () => win === null && newWin())