// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: magic;
const User = 'DTZSGHNR ！'
const Payday = 12 // 每月的几号发工资
const countdown = '2025-01-20' // 自定义倒计时日期
const exegesis = '天回家'
const apiKey = "" // 你的API key

// 获取设备的当前位置
const location = await getLocation()
const gcj02Coords = wgs84ToGcj02(location.latitude, location.longitude)
console.log(`WGS-84 坐标: ${location.latitude}, ${location.longitude}`)
console.log(`GCJ-02 转换后的坐标: ${gcj02Coords.latitude}, ${gcj02Coords.longitude}`)
const coordinates = `${gcj02Coords.longitude},${gcj02Coords.latitude}` // 使用 GCJ-02 坐标系的经纬度

const weatherAPIUrl = `https://api.caiyunapp.com/v2.6/${apiKey}/${coordinates}/realtime`
console.log(`请求的 API URL: ${weatherAPIUrl}`)

const today = new Date()
const formattedToday = formatDate(today)

// 获取农历数据
const lunarData = await getLunarData(formattedToday)

// 获取实时天气数据
const weatherData = await getRealtimeWeatherData()

// 创建并预览中号组件
const widget = createMediumWidget()
widget.presentMedium() // 预览中号组件
Script.setWidget(widget)
Script.complete()

/**
 * 创建中号桌面小组件
 */
function createMediumWidget() {
    const w = new ListWidget()
    const bgColor = new LinearGradient()
    bgColor.colors = [new Color('#2c5364'), new Color('#203a43'), new Color('#0f2027')]
    bgColor.locations = [0.0, 0.5, 1.0]
    w.backgroundGradient = bgColor
    w.setPadding(12, 12, 12, 0)
    w.spacing = 6

    // 问候语
    const greeting = getGreeting(today.getHours())
    const Line1 = w.addText(`[🤖] Hi, ${User}. Good ${greeting}`)
    Line1.textColor = new Color('#ffffff')
    Line1.font = new Font('Menlo', 11)

    // 当前日期和农历
    const dfTime = new DateFormatter()
    dfTime.locale = 'en'
    dfTime.useMediumDateStyle()
    dfTime.useNoTimeStyle()
    const enTime = dfTime.string(today)
    const Line2 = w.addText(`[📅] ${enTime} ${lunarData}`)
    Line2.textColor = new Color('#C6FFDD')
    Line2.font = new Font('Menlo', 11)

    // 实时天气信息
    const weatherLine = w.addText(`[🌡] 体感温度: ${weatherData.apparent_temperature}°C | 天气: ${translateSkycon(weatherData.skycon)}`)
    weatherLine.textColor = new Color('#ffffff')
    weatherLine.font = new Font('Menlo', 11)

    const aqiLine = w.addText(`[💨] AQI: ${weatherData.aqi} | 空气质量: ${weatherData.air_quality_description}`)
    aqiLine.textColor = new Color('#ffffff')
    aqiLine.font = new Font('Menlo', 11)

    // 倒计时和进度条
    const countdownDaysLeft = calculateDaysLeft(countdown)
    const yearProgress = calculateYearProgress(countdown)
    const Line3 = w.addText(`[⏳] ${renderProgress(yearProgress)} ${countdownDaysLeft} ${exegesis}`)
    Line3.textColor = new Color('#FFD700')
    Line3.font = new Font('Menlo', 11)

    // 发工资倒计时和进度条
    const paydayCountdown = calculatePaydayCountdown()
    const Line4 = w.addText(`[💰] ${renderPaydayProgress()} ${paydayCountdown} 天发工资`)
    Line4.textColor = new Color('#f19c65')
    Line4.font = new Font('Menlo', 11)

    return w
}

/**
 * 获取当前位置的经纬度
 */
async function getLocation() {
    try {
        Location.setAccuracyToBest() // 设置定位精度为最高
        const location = await Location.current() // 获取当前位置
        return {
            latitude: location.latitude,
            longitude: location.longitude
        }
    } catch (error) {
        console.error("获取位置失败:", error)
        return {
            latitude: "0",
            longitude: "0"
        }
    }
}

/**
 * WGS-84 坐标系转换为 GCJ-02 坐标系
 */
function wgs84ToGcj02(lat, lon) {
    if (outOfChina(lat, lon)) {
        return { latitude: lat, longitude: lon }
    }
    const dLat = transformLat(lon - 105.0, lat - 35.0)
    const dLon = transformLon(lon - 105.0, lat - 35.0)
    const radLat = lat / 180.0 * Math.PI
    const magic = Math.sin(radLat)
    const sqrtMagic = Math.sqrt(1 - 0.00669342162296594323 * magic * magic)
    const mgLat = lat + (dLat * 180.0) / ((6335552.717000426 * sqrtMagic) * Math.PI)
    const mgLon = lon + (dLon * 180.0) / (6378245.0 / sqrtMagic * Math.cos(radLat) * Math.PI)
    return { latitude: mgLat, longitude: mgLon }
}

function transformLat(x, y) {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
    ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0
    ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0
    return ret
}

function transformLon(x, y) {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
    ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0
    ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0
    return ret
}

function outOfChina(lat, lon) {
    return (lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271)
}
/**
 * 获取实时天气数据，限制每小时请求一次
 */
async function getRealtimeWeatherData() {
    const cacheKey = "weatherDataCache"
    const cacheExpirationKey = "weatherDataCacheExpiration"

    // 尝试获取缓存中的数据
    const cache = Keychain.contains(cacheKey) ? Keychain.get(cacheKey) : null
    const cacheExpiration = Keychain.contains(cacheExpirationKey) ? Keychain.get(cacheExpirationKey) : null

    // 获取当前时间戳
    const now = new Date().getTime()

    // 如果缓存存在且未过期（1小时内），并且 AQI 有效，则使用缓存
    if (cache && cacheExpiration && now - parseInt(cacheExpiration) < 3600000) {
        const cachedData = JSON.parse(cache)
        // 检查缓存中的 AQI 数据，如果为 0 则重新请求数据
        if (cachedData.aqi > 0 && cachedData.air_quality_description) {
            console.log("使用缓存中的天气数据")
            console.log("缓存中的天气数据:", cachedData) // 打印缓存中的数据
            return cachedData
        }
    }

    // 否则，发出API请求
    const url = weatherAPIUrl
    const request = new Request(url)
    
    try {
        const res = await request.loadJSON()

        // 输出完整响应，检查其结构
        console.log("API 响应:", res)

        if (!res.result || !res.result.realtime) {
            throw new Error("响应中缺少 'result' 或 'realtime' 字段")
        }

        // 解析实时天气信息
        const realtime = res.result.realtime
        const weatherData = {
            apparent_temperature: realtime.apparent_temperature,
            aqi: realtime.air_quality.aqi.chn > 0 ? realtime.air_quality.aqi.chn : "N/A",
            air_quality_description: realtime.air_quality.description.chn || "无法获取空气质量",
            skycon: realtime.skycon
        }

        // 将数据存入缓存
        Keychain.set(cacheKey, JSON.stringify(weatherData))
        Keychain.set(cacheExpirationKey, now.toString())

        console.log("新的天气数据已缓存:", weatherData) // 打印新缓存的数据

        return weatherData
    } catch (error) {
        console.error("获取实时天气数据失败:", error)
        return {
            apparent_temperature: "N/A",
            aqi: "N/A",
            air_quality_description: "无法获取空气质量",
            skycon: "无法获取天气"
        }
    }
}

/**
 * 翻译天气现象代码为中文描述
 */
function translateSkycon(skycon) {
    const skyconMap = {
        "CLEAR_DAY": "晴（白天）",
        "CLEAR_NIGHT": "晴（夜间）",
        "PARTLY_CLOUDY_DAY": "多云（白天）",
        "PARTLY_CLOUDY_NIGHT": "多云（夜间）",
        "CLOUDY": "阴",
        "LIGHT_HAZE": "轻度雾霾",
        "MODERATE_HAZE": "中度雾霾",
        "HEAVY_HAZE": "重度雾霾",
        "LIGHT_RAIN": "小雨",
        "MODERATE_RAIN": "中雨",
        "HEAVY_RAIN": "大雨",
        "STORM_RAIN": "暴雨",
        "FOG": "雾",
        "LIGHT_SNOW": "小雪",
        "MODERATE_SNOW": "中雪",
        "HEAVY_SNOW": "大雪",
        "STORM_SNOW": "暴雪",
        "DUST": "浮尘",
        "SAND": "沙尘",
        "WIND": "大风"
    }
    return skyconMap[skycon] || "未知天气现象"
}

/**
 * 获取问候语
 */
function getGreeting(hour) {
    if (hour < 8) return 'midnight'
    if (hour < 12) return 'morning'
    if (hour < 19) return 'afternoon'
    if (hour < 21) return 'evening'
    return 'night'
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * 获取农历数据
 */
async function getLunarData(date) {
    const url = `https://www.36jxs.com/api/Commonweal/almanac?sun=${date}`
    const request = new Request(url)
    const res = await request.loadJSON()

    const tianGanDiZhiYear = res.data.TianGanDiZhiYear
    const animal = res.data.LYear
    const lunarMonth = res.data.LMonth
    const lunarDay = res.data.LDay

    return `${tianGanDiZhiYear}年（${animal}）${lunarMonth}${lunarDay}`
}

/**
 * 计算到目标日期的剩余天数
 */
function calculateDaysLeft(dateString) {
    const targetDate = new Date(dateString)
    const diffTime = targetDate - today
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 计算年度进度（剩余天数）
 */
function calculateYearProgress(targetDateStr) {
    const targetDate = new Date(targetDateStr)
    const startOfYear = new Date(today.getFullYear(), 0, 1)
    const endOfYear = new Date(today.getFullYear(), 11, 31) // 当前年份的12月31日
    const totalDaysInYear = (endOfYear - startOfYear) / (1000 * 60 * 60 * 24) // 当前年份的总天数
    const remainingDays = (targetDate - today) / (1000 * 60 * 60 * 24) // 剩余天数
    const progress = Math.max(remainingDays / totalDaysInYear, 0)

    console.log(`Total Days in Year: ${totalDaysInYear}, Remaining Days: ${remainingDays}, Year Progress: ${progress}`)

    return progress
}

/**
 * 计算发工资倒计时
 */
function calculatePaydayCountdown() {
    let nextPayday = new Date(today.getFullYear(), today.getMonth(), Payday)
    if (today > nextPayday) {
        nextPayday = new Date(today.getFullYear(), today.getMonth() + 1, Payday)
    }
    const diffTime = nextPayday - today
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 渲染发工资进度条（剩余天数）
 */
function renderPaydayProgress() {
    let nextPayday = new Date(today.getFullYear(), today.getMonth(), Payday)
    if (today > nextPayday) {
        nextPayday = new Date(today.getFullYear(), today.getMonth() + 1, Payday)
    }

    const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() // 当前月份的总天数
    const daysLeft = calculatePaydayCountdown() // 剩余天数
    const progress = daysLeft / totalDays

    console.log(`Total Days in Month: ${totalDays}, Days Left: ${daysLeft}, Payday Progress: ${progress}`)

    return renderProgress(progress)
}

/**
 * 渲染进度条
 */
function renderProgress(progress) {
    const filled = '▓'.repeat(Math.floor(progress * 24)) // 根据剩余时间比例生成已填充部分
    const empty = '░'.repeat(24 - filled.length) // 剩余部分为空白
    return `${filled}${empty}` // 返回完整的进度条
}