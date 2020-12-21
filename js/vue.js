  class Vue {
    constructor (options) {
      // 1. 通过属性保存选项的数据
      this.$options = options || {}
      this.$data = options.data || {}
      // 判断 el 是字符串则转化为 DOM 对象
      this.$el = typeof options.el === 'string' ? document.querySelector(options.el) : options.el
      // 2. 把 data 中的成员转换为 getter/setter，注入到 Vue 实例中
      this._proxyData(this.$data)
      // 3. 调用 observer 对象，监听数据变化
      new Observer(this.$data)
      // 4. 调用 compiler 对象，解析指令和差值表达式
      new Compiler(this)
    }
    // 处理 data 中的成员，将 data 成员注入到 Vue 实例中
    _proxyData (data) {
      // 遍历 data 中的所有属性成员
      Object.keys(data).forEach(key => {
        // 将 data 的属性成员注入到 Vue 实例中，这里 this 指向的是 Vue 实例
        Object.defineProperty(this, key, {
          enumerable: true, // 可枚举
          configurable: true, // 可配置
          get () {
            return data[key]
          },
          set (newValue) {
            if (newValue === data[key]) {
              return
            }
            data[key] = newValue
          }
        }) 
      })
    }
  }