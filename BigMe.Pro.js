// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: magic;
/**
 * Scriptable for BigMe.Pro - Dracula Theme Enhanced UI without Divider in Progress Bar
 * @Author: fuhao
 * @Date: 2023-03-22 22:34:00
 * @LastEditors: fuhao
 * @LastEditTime: 2023-03-22 22:34:00
 * @Description: BigMe.Pro 小组件 - Dracula 主题，无分割进度条
 * @Version: 1.7
 * @License: MIT
 */

const subscribe_url = "https://must.bigme.pro/api/v1/user/getSubscribe";
const login_url = "https://must.bigme.pro/api/v1/passport/auth/login";

// 登录参数，请替换为自己的账号和密码
const loginParams = {
  email: "2753086015@qq.com",
  password: "Shf071800.",
};

// 登录以获取授权数据
async function login() {
  try {
    const req = new Request(login_url);
    req.method = "POST";
    req.headers = { "Content-Type": "application/json" };
    req.body = JSON.stringify(loginParams);

    const res = await req.loadJSON();
    if (res.status !== "success") {
      log("登录失败，状态：" + res.status);
      return null;
    } else {
      return res.data.auth_data || null;
    }
  } catch (error) {
    log("登录失败：" + error);
    return null;
  }
}

// 获取订阅信息
async function getSubscribe() {
  try {
    const req = new Request(subscribe_url);
    req.method = "GET";
    const authorization = await login();
    req.headers = { authorization };

    const res = await req.loadJSON();
    if (res.status !== "success") {
      log("请求失败，状态：" + res.status);
    }
    return res;
  } catch (error) {
    log("请求失败：" + error);
    return null;
  }
}

// 处理订阅信息并返回所需数据
async function handleSubscribe() {
  const data = await getSubscribe();

  if (data) {
    const name = data.data.plan.name;
    const u = data.data.u;
    const d = data.data.d;
    const total = data.data.transfer_enable;

    const use = (u + d) / (1024 * 1024);
    const useFormatted = use > 1024 ? (use / 1024).toFixed(2) + "GB" : use.toFixed(2) + "MB";
    const reset_day = data.data.reset_day
      ? `距离到期还有 ${data.data.reset_day} 天`
      : "该订阅长期有效";

    const usedPercentage = Math.min(use / (total / (1024 * 1024)), 1);

    return {
      planName: name,
      useFormatted,
      totalFormatted: (total / (1024 * 1024 * 1024)).toFixed(2) + "GB",
      reset_day,
      usedPercentage,
    };
  } else {
    log("获取订阅信息失败");
    return null;
  }
}

// 创建和更新小组件，并应用 Dracula 主题样式
async function updateWidget() {
  const subscribeData = await handleSubscribe();

  if (subscribeData) {
    const { planName, useFormatted, totalFormatted, reset_day, usedPercentage } = subscribeData;

    // 配色设置（白天：浅色，夜间：Dracula 主题）
    const dynamicColor = Color.dynamic(new Color("#FFFFFF"), new Color("#282a36"));
    const titleColor = Color.dynamic(new Color("#4A4A4A"), new Color("#6272a4"));
    const packageColor = Color.dynamic(new Color("#007aff"), new Color("#8be9fd"));
    const flowColor = Color.dynamic(new Color("#34c759"), new Color("#50fa7b"));
    const subscribeColor = Color.dynamic(new Color("#ff3b30"), new Color("#ff79c6"));
    const progressBarColor = Color.dynamic(new Color("#34c759"), new Color("#bd93f9"));
    const progressBgColor = Color.dynamic(new Color("#C0C0C0"), new Color("#44475a"));

    // 创建小组件并设置背景颜色
    let widget = new ListWidget();
    widget.backgroundColor = dynamicColor;
    widget.setPadding(10, 15, 10, 15);

    // 添加标题
    let title = widget.addText("我的订阅");
    title.font = Font.boldSystemFont(16);
    title.textColor = titleColor;
    widget.addSpacer(10);

    // 显示套餐名称
    let nameText = widget.addText(planName);
    nameText.font = Font.boldSystemFont(18);
    nameText.textColor = packageColor;
    widget.addSpacer(5);

    // 显示订阅状态
    let statusText = widget.addText(`${reset_day}`);
    statusText.font = Font.systemFont(12);
    statusText.textColor = subscribeColor;
    widget.addSpacer(5);

    // 创建进度条容器
    let progressBar = widget.addStack();
    progressBar.layoutHorizontally();
    progressBar.centerAlignContent();
    progressBar.size = new Size(270, 10);
    progressBar.cornerRadius = 3; // 仅对外层容器应用圆角

    // 已用进度条
    let usedBar = progressBar.addStack();
    usedBar.size = new Size(270 * usedPercentage, 10);
    usedBar.backgroundColor = progressBarColor;

    // 未用进度条
    let unusedBar = progressBar.addStack();
    unusedBar.size = new Size(270 * (1 - usedPercentage), 10);
    unusedBar.backgroundColor = progressBgColor;

    widget.addSpacer(8);

    // 显示已用流量和总流量
    let usageText = widget.addText(`已用 ${useFormatted} / 总计 ${totalFormatted}`);
    usageText.font = Font.systemFont(14);
    usageText.textColor = flowColor;

    // 显示最后刷新时间
    widget.addSpacer();
    const now = new Date();
    let refreshTimeText = widget.addText(`最后刷新：${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
    refreshTimeText.font = Font.systemFont(10);
    refreshTimeText.textColor = titleColor;
    refreshTimeText.rightAlignText();

    // 设置自动刷新时间
    widget.refreshAfterDate = new Date(Date.now() + 60 * 1000);

    return widget;
  } else {
    log("无法加载订阅数据");
    return null;
  }
}

// 切换小组件颜色并显示
async function ToggleColors() {
  let widget = await updateWidget();
  if (widget) {
    Script.setWidget(widget);
    widget.presentMedium();
  }
}

await ToggleColors();
Script.complete();