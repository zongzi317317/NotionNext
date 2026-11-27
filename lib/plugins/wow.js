const { loadExternalResource } = require('../utils')

/**
 * WOWjs动画，结合animate.css使用很方便
 * 是data-aos的平替 aos ≈ wowjs + animate
 */
export const loadWowJS = async () => {
  await loadExternalResource('/css/wow/animate.css', 'css')
  // 自托管 wow.js 1.1.2：卡片在脚本加载前是隐藏的，境外 CDN 慢会导致内容迟迟不显示
  await loadExternalResource('/vendor/wow/wow.min.js', 'js')
  // 配合animatecss 实现延时滚动动画，和AOS动画相似
  const WOW = window.WOW
  if (WOW) {
    new WOW().init()
  }
}
