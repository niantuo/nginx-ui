/**
 * 是否为桌面应用
 */
let isDesktop = false;
// @ts-ignore
if (window.go){
    isDesktop = true
}

export {
    isDesktop
}
