class Observer {
  constructor (data) {
    this.walk(data)
  }
  // 遍历 data
  walk (data) {
    // 1. 判断 data 是否是对象
    if (!data || typeof data !== 'object') {
      return
    }
    // 2. 遍历 data 对象的所有属性
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key])
    })
  }

  // 将 data 对象属性成员转换为响应式数据
  defineReactive (obj, key, val) {
    const that = this
    // 负责收集依赖，并发送通知
    const dep = new Dep()
    // 如果 val 是对象，把 val 内部的属性转换为响应式数据
    this.walk(val)

    Object.defineProperty(obj, key, {
      enumerable: true, // 可枚举的
      configurable: true, // 可配置的
      get () {
        // 收集依赖（Watcher 实例化的时候会把自己添加到 Dep 的 target 静态属性中去）
        Dep.target && dep.addSub(Dep.target)
        return val  // 这里为什么使用 val 而不是 obj[key] 是有原因的，看下面章节
      },
      set (newValue) {
        if (newValue === val) {
          return
        }
        val = newValue
        that.walk(newValue)
        // 发送通知
        dep.notify()
      }
    })
  }
}