auto.waitFor();

// 1. 请求截图权限
if (!requestScreenCapture()) {
    toastLog("请求截图失败，脚本停止");
    exit();
}

// --- 自定义配置区 ---
const TARGET_TASKS = ["白银", "蓝絮"]; // 使用模糊匹配更稳定

const TABS = [
    { pos: [550, 2300] }, 
    { pos: [750, 2300] }, 
    { pos: [950, 2300] }
];

const REJECT_BTN = [700, 2100]; 
// ------------------

// 【新增】状态记录器：记录每个 Tab 是否已经刷好
let isLocked = [false, false, false];

function checkTaskWithOCR() {
    let img = captureScreen();
    if (!img) return false;
    try {
        let result = gmlkit.ocr(img, "zh");
        let textResult = result.text; 
        log("识别结果: " + textResult.replace(/\n/g, " "));
        return TARGET_TASKS.some(target => textResult.indexOf(target) !== -1);
    } catch (e) {
        log("OCR 错误: " + e);
        return false;
    }
}

function main() {
    toastLog("🚀 智能锁定刷新脚本启动");
    
    while (true) {
        // 检查是否所有任务都已锁定
        if (isLocked.every(status => status === true)) {
            log("🎉 所有任务栏均已达标，脚本退出。");
            device.vibrate(2000);
            break;
        }

        for (let i = 0; i < TABS.length; i++) {
            // 如果该位置已经刷好了，直接跳过，不点击也不识别
            if (isLocked[i]) {
                log("跳过第 " + (i + 1) + " 号栏 (已锁定)");
                continue; 
            }

            log("-------------------------------");
            log("正在检查第 " + (i + 1) + " 号栏");

            // 1. 切换 Tab
            click(TABS[i].pos[0], TABS[i].pos[1]);
            sleep(1500); // 适当延长等待，确保刷新成功

            // 2. OCR 检查
            if (checkTaskWithOCR()) {
                log("✅ 第 " + (i + 1) + " 号栏匹配成功，锁定。");
                isLocked[i] = true; // 锁定该位置
            } else {
                log("❌ 第 " + (i + 1) + " 号栏不匹配，拒绝并尝试流转刷新");
                click(REJECT_BTN[0], REJECT_BTN[1]);
                sleep(800);
                // 即使拒绝了，也会因为 for 循环切换到下一个 Tab，从而触发本位的刷新
            }
        }
        
        sleep(500); // 每一轮轮询后的短暂休息
    }
}

threads.start(main);
