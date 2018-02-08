#!/usr/bin/env node
const argv = require('yargs').argv
const fs = require('fs-extra')
const path = require('path')
const ProgressBar = require('progress')

const {
    spinner: spinnerObj,
    pathname,
} = require('./libs/vars')
const spinner = require('./libs/commons/spinner')

const strPaddingLength = 50
const strPaddingStr = '─'

const download = async (title, run) => {
    const step = title
    const waiting = spinner(step)

    let bar
    let interval
    let currentFrame = 0

    const symbolTicking = () => {
        let symbol = '\x1b[36m' + spinnerObj.frames[currentFrame] + '\x1b[0m'
        bar.tick(0, {
            symbol
        })
        currentFrame++
        if (currentFrame > spinnerObj.frames.length - 1)
            currentFrame = 0
    }
    await run(({
        // ship,
        // index,
        length
    }) => {
        // console.log(currentShipIndex, shipsCount)
        if (!bar) {
            waiting.stop()
            bar = new ProgressBar(
                `:symbol ${step} [:bar] :current / :total`,
                {
                    total: length,
                    width: 20,
                    complete: '■',
                    incomplete: '─',
                    clear: true
                }
            )
            symbolTicking()
            interval = setInterval(symbolTicking, spinnerObj.interval)
        }
        bar.tick()
    })
        .then(() => {
            waiting.stop()
            clearInterval(interval)
            spinner(step).finish()
        })
        .catch(err =>
            waiting.fail(step + '\n  ' + (err.message || err))
        )
}

const run = async () => {
    let token

    { // 确定访问DMM的token
        if (argv.token)
            token = argv.token
        else if (Array.isArray(argv._) && argv._.length) {
            token = argv._[0] + ''
            if (token.substr(0, 6) == 'token=' ||
                token.substr(0, 6) == 'token:')
                token = token.substr(6)
        }
    }

    console.log(''.padEnd(strPaddingLength, strPaddingStr))
    console.log('')

    /************************************************
     * 确保内容存储目录和相关文件路径
     ***********************************************/
    {
        fs.ensureDirSync(pathname.fetchedData)
    }

    /************************************************
     * 如果提供了token，获取游戏API - start2
     ***********************************************/
    if (token) {
        console.log(`√ Token: ${token}`)

        const step = '获取游戏API - start2'
        const waiting = spinner(step)
        const run = require('./libs/fetch-gameapi/start2')

        await run({
            token
        })
            .then(data => {
                fs.writeFileSync(
                    path.join(pathname.apiStart2),
                    JSON.stringify(data, undefined, 4)
                )
                waiting.finish()
                // console.log(data)
            })
            .catch(err => {
                let msg = ''
                if (err && err.message) {
                    msg = err.message
                } else if (err.api_result_msg) {
                    if (err.api_result) {
                        msg = `[${err.api_result}] ${err.api_result_msg}`
                    } else
                        msg = err.api_result_msg
                }
                waiting.fail(step + '\n  ' + msg)
            })
    }

    /************************************************
     * 检查api_start2.json
     ***********************************************/
    if (!fs.existsSync(pathname.apiStart2)) {
        console.log('❌  终止! '.padEnd(strPaddingLength, strPaddingStr))
        console.log('')

        if (!token) {
            console.log('请输入正确的命令')
            console.log('npm start -- [token]')
        } else {
            console.log('获取 api_start2 发生错误!')
        }

        console.log('')
        console.log(''.padEnd(strPaddingLength, strPaddingStr))
        return
    }

    /************************************************
     * 准备pics和database代码库
     ***********************************************/
    {
        const step = '准备代码库'

        const run = async type => {
            const thisStep = step + ` (${type})`
            const waiting = spinner(thisStep)
            return require('./libs/commons/prepare-repo-dir')(type)
                .then(() => waiting.finish())
                .catch(err =>
                    waiting.fail(thisStep + '\n  ' + (err.message || err))
                )
        }

        await run('database')
        await run('pics')
    }

    /************************************************
     * 下载舰娘图片
     ***********************************************/
    {
        await download(
            '下载舰娘图片',
            require('./libs/fetch-pics/ships')
        )
    }

    /************************************************
     * 下载装备图片
     ***********************************************/
    {
        await download(
            '下载装备图片',
            require('./libs/fetch-pics/equipments')
        )
    }

    /************************************************
     * 初始化database
     ***********************************************/
    {

    }

    /************************************************
     * 比对所有舰娘图片和已有图片，选择出新的图片
     ***********************************************/
    {

    }

    /************************************************
     * 复制所有新图片到pics代码库
     ***********************************************/
    {

    }

    /************************************************
     * pics代码库执行start
     ***********************************************/
    {

    }

    /************************************************
     * 更新database
     ***********************************************/
    {

    }

    console.log('')
    console.log('\x1b[36m' + '完成!' + '\x1b[0m')
    console.log('')
    console.log(''.padEnd(strPaddingLength, strPaddingStr))
}

run()