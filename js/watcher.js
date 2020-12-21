  class Watcher {
    constructor (vm, key, cb) {
      // Vue 实例对象
      this.vm = vm
      // data 中的属性名称
      this.key = key
      // 回调函数负责更新视图
      this.cb = cb

      // 把 Watcher 实例对象记录到 Dep 类的静态属性 target
      Dep.target = this
      // 这里要触发 getter 方法，在 getter 方法内会调用 addsub 方法
      // 将记录在 Dep.target 的 Watcher 实例对象添加到 dep.subs 数组中
      // 刚好下面代码在获取观察的属性值的时候触发了 getter 方法中的 dep.addsub(Dep.target)

      // 记录实例化 Watcher 对象时观察的属性值
      this.oldValue = vm[key]

      // 释放 Dep.target
      Dep.target = null
    }
    // 当数据发生变化的时候更新视图
    update () {
      // 因为当 update 方法被调用时已经是触发了属性的 setter 方法了，可以拿到最新的值
      const newValue = this.vm[this.key]
      // 对比旧值和新值
      if (this.oldValue === newValue) {
        return
      }
      // 调用回调函数更新视图
      this.cb(newValue)
    }
  }