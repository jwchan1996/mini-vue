  class Compiler {
    constructor (vm) {
      this.el = vm.$el
      this.vm = vm
      this.compile(this.el)
    }
    // 编译模板，处理文本节点和元素节点
    compile (el) {
      let childNodes = el.childNodes  // 获取所有子节点，伪数组
      Array.from(childNodes).forEach(node => {
        // 判断节点类型
        if (this.isTextNode(node)) {
          // 处理文本节点
          this.compileText(node)
        } else if (this.isElementNode(node)) {
          // 处理元素节点
          this.compileElement(node)
        }

        // 判断 node 节点，是否有子节点，如果有子节点，要递归调用 compile
        if (node.childNodes && node.childNodes.length) {
          this.compile(node)
        }
      })
    }
    // 编译元素节点，处理指令
    compileElement (node) {
      // console.log(node.attributes) // 打印节点属性
      // 遍历元素节点的所有属性节点
      Array.from(node.attributes).forEach(attr => {
        // 判断是否是指令
        let attrName = attr.name
        if (this.isDirective(attrName)) {
          // 对不同指令进行不同处理
          // 这里不使用 if 判断，将处理方法抽离出去
          // v-text -> text 只取描述指令功能的字符，用于拼接调用处理函数 textUpdater
          attrName = attrName.substr(2)
          // 属性值
          const key = attr.value
          // 增加对 v-on 指令的处理，如 v-on:click => on:click，这里截取的 attrName 是 :click
          if (attrName.startsWith('on:')) {
            const eventStr = attrName.substr(3)
            this.dealWithOnUpdater(node, eventStr, key)
            return
          }
          // 调用统一处理属性名的方法
          this.update(node, attrName, key) 
        }
      })
    }
    // 统一处理属性名
    update (node, attrName, key) {
      // 调用属性名对应的指令处理函数（这里用字符串拼接的方式找到对应的指令处理函数）
      const updaterFn = this[attrName + 'Updater']
      // 保证指令处理函数存在才调用
      // updaterFn && updaterFn(node, this.vm[key], key)
      /**
       * 这里需要注意的是，这里调用 updateFn 方法也就是调用 textUpdater 方法时，
       * textUpdater 方法内部的 this 指向的并不是 Compiler 实例对象，
       * 需要用 call 来改变 this 指向，以便于 new Watcher 的时候使用
       */ 
      updaterFn && updaterFn.call(this, node, this.vm[key], key)
    }
    // 处理 v-text
    textUpdater (node, value, key) {
      node.textContent = value
      new Watcher(this.vm, key, (newValue) => {
        node.textContent = newValue
      })
    }
    // 处理 v-model
    modelUpdater (node, value, key) {
      node.value = value
      new Watcher(this.vm, key, (newValue) => {
        node.value = newValue
      })
      // 双向绑定
      node.addEventListener('input', () => {
        this.vm[key] = node.value
      })
    }
    // 处理 v-html
    htmlUpdater (node, value, key) {
      node.innerHTML = value
      new Watcher(this.vm, key, (newValue) => {
        node.innerHTML = newValue
      })
    }
    // 处理 v-on（未将 methods 中的函数注入 Vue 实例所以未处理函数参数情况）
    dealWithOnUpdater (node, eventStr, jsCode) {
      window.addEventListener('load', () => {
        node.addEventListener(eventStr, () => {
          eval(jsCode)
        })
      }) 
    }

    // 编译文本节点，处理差值表达式
    compileText (node) {
      // 使用正则替换 {{  msg }} 差值表达式内容
      // . 表示匹配任意单个字符不包含换行
      // + 表示匹配前面内容出现一次或多次 .+ 可以匹配差值表达式内的成员
      // ? 表示非贪婪模式，表示尽可能早地结束匹配
      // 我们需要提取 {{  msg }} 中的 msg，可以在正则中使用 () 把需要提取的信息包起来
      // () 有分组的含义
      const reg = /\{\{(.+?)\}\}/
      const textContent = node.textContent  // {{  msg }}
      if (reg.test(textContent)) {
        // RegExp.$1 可以获取正则匹配的第一个分组内容
        const key = RegExp.$1.trim()
        // 文本节点可能有多个差值表达式，这里暂时只处理第一个差值表达式
        node.textContent = textContent.replace(reg, this.vm[key])
        // node.textContent = this.vm[key]   // 使用这种会替换整个文本节点内容，不符合

        // 创建 watcher 对象，当数据改变更新视图
        new Watcher(this.vm, key, (newValue) => {
          node.textContent = newValue
        })
      }
    }
    // 判断元素属性是否是指令
    isDirective (attrName) {
      return attrName.startsWith('v-')
    }
    // 判断元素是否是文本节点
    isTextNode (node) {
      return node.nodeType === 3
    }
    // 判断元素是否是元素节点
    isElementNode (node) {
      return node.nodeType === 1
    }
  }