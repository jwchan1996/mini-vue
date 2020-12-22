# mini-vue

模拟实现最简 vue 2.x

```bash
├── js
│   ├── compiler.js
│   ├── dep.js
│   ├── observer.js
│   ├── vue.js
│   └── watcher.js
├── index.html
```

## Vue 响应式原理模拟

- [Vue 2.x 深入响应式原理](https://cn.vuejs.org/v2/guide/reactivity.html)
- [MDN - Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- 浏览器兼容 IE8 以上（不兼容 IE8）

当我们把一个普通的 `JavaScript` 对象传入 `Vue` 实例作为 `data` 选项，`Vue` 将遍历此对象所有的 `property`，并使用 `Object.defineProperty` 把这些 `property` 全部转为 `getter/setter`。`Object.defineProperty` 是 `ES5` 中一个无法 `shim` （降级）的特性，这也就是 `Vue` 不支持 `IE8` 以及更低版本浏览器的原因。

这些 `getter/setter` 对用户来说是不可见的，但是在内部它们让 `Vue` 能够追踪依赖，在 `property` 被访问和修改时通知变更。

每个组件实例都对应一个 `watcher` 实例，它会在组件渲染的过程中把“接触”过的数据 `property` 记录为依赖。之后当依赖项的 `setter` 触发时，会通知 `watcher`，从而使它关联的组件重新渲染。

![image](https://cn.vuejs.org/images/data.png)

下面是 `Object.defineProperty()` 的用法：

```html
<!DOCTYPE html>
<html lang="cn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>defineProperty</title>
</head>
<body>
  <div id="app">
    hello
  </div>
  <script>
    // 模拟 Vue 中的 data 选项
    let data = {
      msg: 'hello'
    }

    // 模拟 Vue 的实例
    let vm = {}

    // 数据劫持：当访问或者设置 vm 中的成员的时候，做一些干预操作
    Object.defineProperty(vm, 'msg', {
      // 可枚举（可遍历）
      enumerable: true,
      // 可配置（可以使用 delete 删除，可以通过 defineProperty 重新定义）
      configurable: true,
      // 当获取值的时候执行
      get () {
        console.log('get: ', data.msg)
        return data.msg
      },
      // 当设置值的时候执行
      set (newValue) {
        console.log('set: ', newValue)
        if (newValue === data.msg) {
          return
        }
        data.msg = newValue
        // 数据更改，更新 DOM 的值
        document.querySelector('#app').textContent = data.msg
      }
    })

    // 测试
    vm.msg = 'Hello World'
    console.log(vm.msg)
  </script>
</body>
</html>
```

在浏览器打开上述 `html` 文件，可以看到控制台会依次输出：

```bash
# Console 控制台
set:  Hello World
get:  Hello World
Hello World
```

在控制台运行代码 `vm.msg = '666'` 手动更改 `msg` 的值，可以看到页面显示内容有原先的 `Hello World` 更新为 `666` 了。

```bash
# Console 控制台
> vm.msg = '666'
  set:  666
< "666"
```

- 如果有一个对象中多个属性需要转换 `getter/setter` 如何处理？

我们应该遍历 `data` 中的属性，让每个属性都通过 `Object.defineProperty()` 方法转换成 `getter/setter`。

```diff
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>defineProperty 多个成员</title>
  </head>
  <body>
    <div id="app">
      hello
    </div>
    <script>
      // 模拟 Vue 中的 data 选项
      let data = {
        msg: 'hello',
+       count: 10
      }

      // 模拟 Vue 的实例
      let vm = {}

+     proxyData(data)

+     function proxyData(data) {
+       // 遍历 data 对象的所有属性
+       Object.keys(data).forEach(key => {
+         // 把 data 中的属性，转换成 vm 的 setter/setter
+         Object.defineProperty(vm, key, {
+           enumerable: true,
+           configurable: true,
+           get () {
+             console.log('get: ', key, data[key])
+             return data[key]
+           },
+           set (newValue) {
+             console.log('set: ', key, newValue)
+             if (newValue === data[key]) {
+               return
+             }
+             data[key] = newValue
+             // 数据更改，更新 DOM 的值
+             document.querySelector('#app').textContent = data[key]
+           }
+         })
+       })
+     }

      // 测试
      vm.msg = 'Hello World'
      console.log(vm.msg)
    </script>
  </body>
  </html>
```

在控制台运行代码 `vm.msg = '666'` 可以看到页面显示内容由原先的 `Hello World` 更新为 `666` 了。再次运行代码 `vm.count = '888'` 可以看到页面显示内容由 `10` 更新为 `888` 了。说明 `data` 中多个属性都被转换为 `getter/setter` 了。

```bash
# Console 控制台
> vm.msg = '666'
  set:  666
< "666"
> vm.count = '888'
  set:  888
< "888"
```

### Vue 3.x

- [MDN - Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- 直接监听对象，而非属性。
- ES6 中新增 Proxy，IE 不支持，性能由浏览器优化

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Proxy</title>
</head>
<body>
  <div id="app">
    hello
  </div>
  <script>
    // 模拟 Vue 中的 data 选项
    let data = {
      msg: 'hello',
      count: 0
    }

    // 模拟 Vue 实例
    let vm = new Proxy(data, {
      // 下面的 get / set 是执行代理行为的函数
      // 当访问 vm 的成员会执行
      get (target, key) {
        console.log('get, key: ', key, target[key])
        return target[key]
      },
      // 当设置 vm 的成员会执行
      set (target, key, newValue) {
        console.log('set, key: ', key, newValue)
        if (target[key] === newValue) {
          return
        }
        target[key] = newValue
        document.querySelector('#app').textContent = target[key]
      }
    })

    // 测试
    vm.msg = 'Hello World'
    console.log(vm.msg)
  </script>
</body>
</html>
```

在浏览器打开上述 `html` 文件，可以看到控制台会依次输出：

```bash
# Console 控制台
set, key:  msg Hello World
get, key:  msg Hello World
Hello World
```

在控制台运行代码 `vm.msg = '111'` 可以看到页面显示内容由原先的 `Hello World` 更新为 `111` 了。再次运行代码 `vm.count = '222'` 可以看到页面显示内容由 `111` 更新为 `222` 了。说明访问 data 的代理对象 vm 会触发 `getter/setter`。

```bash
# Console 控制台
> vm.msg = '111'
  set, key:  msg 111
< "111"
> vm.count = '222'
  set, key:  count 222
< "222"
```

使用 `Proxy` 要比使用 `Object.defineProperty()` 方法的代码要简洁得多。`Proxy` 代理的是整个对象，我们在访问代理对象的所有方法都会触发代理对象中的 `getter/setter` 方法。而使用 `Object.defineProperty()` 方法时需要对 `data` 对象进行循环，对每个属性进行进行 `Object.defineProperty()`。而且，`Proxy` 由浏览器进行性能优化，所以 `Proxy` 的性能会比 `Object.defineProperty()` 方法要好。

## 发布订阅模式和观察者模式

### 发布/订阅模式

- 发布/订阅模式
    - 订阅者
    - 发布者
    - 信号中心

> 我们假定，存在一个"信号中心"，某个任务执行完成，就向信号中心"发布"（publish）一个信
号，其他任务可以向信号中心"订阅"（subscribe）这个信号，从而知道什么时候自己可以开始执
行。**这就叫做"发布/订阅模式"（publish-subscribe pattern）**

- Vue 的自定义事件
    - [Vue 的自定义事件](https://cn.vuejs.org/v2/guide/migration.html#dispatch-%E5%92%8C-broadcast-%E6%9B%BF%E6%8D%A2)

```javascript
let vm = new Vue()

vm.$on('dataChange', () => {
  console.log('dataChange')
})

vm.$on('dataChange', () => {
  console.log('dataChange1')
})

vm.$emit('dataChange')
```

- 兄弟组件通信过程

```javascript
// eventBus.js 
// 事件中心 
let eventHub = new Vue() 
// ComponentA.vue 
// 发布者 
addTodo: function () { 
  // 发布消息(事件) 
  eventHub.$emit('add-todo', { text: this.newTodoText })
  this.newTodoText = '' 
}

// ComponentB.vue 
// 订阅者 
created: function () { 
  // 订阅消息(事件) 
  eventHub.$on('add-todo', this.addTodo) 
}
```

- 模拟 Vue 自定义事件的实现

分析：

```javascript
// Vue 自定义事件
let vm = new Vue()
// { 'click': [fn1, fn2], 'change': [fn] }

// 注册事件(订阅消息)
vm.$on('dataChange', () => {
  console.log('dataChange')
})

vm.$on('dataChange', () => {
  console.log('dataChange1')
})
// 触发事件(发布消息)
vm.$emit('dataChange')
```

下面使用发布/订阅模式来模拟 `Vue` 中的事件机制。

```javascript
// 事件触发器
class EventEmitter {
  constructor () {
    // { 'click': [fn1, fn2], 'change': [fn] }
    this.subs = Object.create(null)
  }

  // 注册事件
  $on (eventType, handler) {
    this.subs[eventType] = this.subs[eventType] || []
    this.subs[eventType].push(handler)
  }

  // 触发事件
  $emit (eventType) {
    if (this.subs[eventType]) {
      this.subs[eventType].forEach(handler => {
        handler()
      })
    }
  }
}

// 测试
let em = new EventEmitter()
em.$on('click', () => {
  console.log('click1')
})
em.$on('click', () => {
  console.log('click2')
})

em.$emit('click')
```

运行代码，可以看到控制台打印：

```bash
# Console 控制台
click1
click2
```

上述的代码是模拟 `Vue` 自定义事件的实现机制，并没有体现发布者和订阅者，只体现了事件中心，也就是 `EventEmitter` 的实例对象。

发布者和订阅者可以通过兄弟组件传值的方式来体会。

### 观察者模式

`Vue` 的响应式原理中使用了观察者模式，下面先了解一下观察者模式是如何实现的。

观察者模式与发布订阅模式的区别是没有事件中心，只有发布者和订阅者，并且发布者要知道订阅者的存在。观察者模式中订阅者又叫观察者，发布者又叫目标。

- **观察者(订阅者)** -- Watcher
    - update()：每个观察者都有 update 方法，当事件发生时，会调用观察者的 update 方法，从而处理具体要做的事情
- **目标(发布者)** -- Dep
    - subs 数组：存储所有的观察者
    - addSub()：添加观察者
    - notify()：当事件发生，调用所有观察者的 update() 方法
- **没有事件中心**

> 关于为什么目标（发布者）用 Dep 表示而不是用更符合语义的 Target 来表示，Vue 内部使用了 Dep 这个单词是因为 Dep 是 dependency（依赖）的缩写。因为 Watcher 观察者（订阅者）需要依赖 Dep 才能了解数据的变化，没有 Dep，Watcher 根本不可能知道数据发生了变化，当有数据变化发生时，Dep 会通知 Watcher

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>观察者模式</title>
</head>
<body>
  <script>
    // 目标（发布者）
    // Dependency
    class Dep {
      constructor () {
        // 数组存储所有观察者
        this.subs = []
      }

      // 添加观察者
      addSub (sub) {
        if (sub && sub.update) {
          this.subs.push(sub)
        }
      }

      // 通知所有观察者调用 upodate 方法
      notify () {
        this.subs.forEach(sub => {
          sub.update()
        })
      }
    }

    // 观察者（订阅者）
    class Watcher {
      update () {
        console.log('update')
      }
    }

    // 测试订阅者模式
    let dep = new Dep()
    let watcher1 = new Watcher()
    let watcher2 = new Watcher()
    dep.addSub(watcher1)
    dep.addSub(watcher2)
    dep.notify()
    
  </script>
</body>
</html>
```

### 总结

- **观察者模式** 是由具体目标调度，比如当事件触发，Dep 就会去调用观察者的方法，所以观察者模式的订阅者和发布者之间是存在依赖的
- **发布/订阅模式** 由统一调度中心（事件中心）调用，因此发布者和订阅者不需要知道对方的存在

> 事件中心隔离了发布者和订阅者,，去除它们之间的相互依赖。观察者模式中，目标与观察者是相互依赖的，而发布订阅模式中，多了个事件中心。事件中心是隔离发布者和订阅者的，减少发布者和订阅者的依赖关系，会变得更加灵活。

![image.png](https://i.loli.net/2020/10/20/iTyUXPoObhHunaZ.png)

## Vue 响应式原理模拟

### 整体分析

#### Vue 基本结构

```html
<!DOCTYPE html>
<html lang="cn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Vue 基础结构</title>
</head>
<body>
  <div id="app">
    <h1>差值表达式</h1>
    <h3>{{ msg }}</h3>
    <h3>{{ count }}</h3>
    <h1>v-text</h1>
    <div v-text="msg"></div>
    <h1>v-model</h1>
    <input type="text" v-model="msg">
    <input type="text" v-model="count">
  </div>

  <script src="./js/vue.js"></script>
  <script>
    let vm = new Vue({
      el: '#app',
      data: {
        msg: 'Hello Vue',
        count: 20,
        items: ['a', 'b', 'c']
      }
    })
  </script>
</body>
</html>
```

#### 打印 Vue 实例观察

在 `Console` 控制台打印上面代码的 `Vue` 实例对象，可以看到实例的成员非常多，我们只需关注需要模拟的成员即可。

除了 `msg` 和 `count`，拉到下面还看到了 `msg` 和 `count` 还具有 `getter/setter`，所以可知 `Vue` 内部会把 `data` 中的成员转化为 `getter/setter`，注入到 `Vue` 实例中，这样做的目的是在其他地方使用的时候可以通过 `this.msg` 和 `this.count` 这样的方式来使用。

`msg` 和 `count` 下面是 `$data`，`data` 中的成员被记录到了 `$data` 中，并且转换成了 `getter/setter`。`$data` 中的 `setter` 是真正监视数据变化的地方。

再往下是 `$options`，可以简单认为把构造函数的参数记录到了 `$options` 中。

再继续往下看可以看到 `_data`，`_data` 和 `$data` 指向的是同一个对象。`_` 开头的是私有成员，`$` 开头的是公共成员，我们只需要模拟 `$data` 即可。

紧跟着的是 `$el`，对应着 `Vue` 选项中的 `el`。设置 `el` 选项的时候，可以是一个选择器，也可以是一个 `DOM` 对象。如果是一个选择器，`Vue` 构造函数内部需要把这个选择器转换成对应的 `DOM` 对象。

下面实现最小版本的 `Vue` 需要模拟 `Vue` 实例中的下列成员：

```bash
$data
$el
$options
```

还要把 `data` 中的成员注入到 `Vue` 实例中来。

#### 整体结构

![image](https://s3.ax1x.com/2020/12/18/rJ4mee.png)

- Vue
    - 把 `data` 中的成员注入到 `Vue` 实例，并且把 `data` 中的成员转成 `getter/setter`
- Observer
    - 数据劫持，能够对数据对象的所有属性进行监听，如有变动可拿到最新值并通知 `Dep`
- Compiler
    - 解析每个元素中的指令/插值表达式，并替换成相应的数据
- Dep
    - 添加观察者(`watcher`)，当数据变化通知所有观察者
- Watcher
    - 内部有 `update` 方法负责更新视图，数据变化则更新视图

### 实现 Vue

可以使用 `js` 的构造函数来实现，也可以使用 `ES6` 的 `class` 来实现，这里使用 `class` 实现。

- 功能
    - 负责接收初始化的参数(选项)
    - 负责把 `data` 中的属性注入到 `Vue` 实例，转换成 `getter/setter`
    - 负责调用 `observer` 监听 `data` 中所有属性的变化
    - 负责调用 `compiler` 解析指令/插值表达式，在视图中绑定数据
- 结构

![image](https://s3.ax1x.com/2020/12/18/rJv3UP.png)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>实现 Vue</title>
</head>
<body>
  <div id="app">
    <h1>差值表达式</h1>
    <h3>{{ msg }}</h3>
    <h3>{{ count }}</h3>
    <h1>v-text</h1>
    <div v-text="msg"></div>
    <h1>v-model</h1>
    <input type="text" v-model="msg">
    <input type="text" v-model="count">
  </div>
  <script>
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
        // 4. 调用 compiler 对象，解析指令和差值表达式
      }
      
      // 对 data 中的属性成员进行访问代理
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

    let vm = new Vue({
      el: '#app',
      data: {
        msg: 'Hello Vue',
        count: 1
      }
    })
  </script>
</body>
</html>
```

在浏览器 `Console` 控制台输入 `vm` 回车，可看到打印出来的 `Vue` 实例的成员是符合预期的。

![image](https://s3.ax1x.com/2020/12/18/rY9SmQ.png)

为了方便阅读，我们把 `Vue` 类抽离出来单独的文件。

```diff
index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>实现 Vue</title>
</head>
<body>
  <div id="app">
    <h1>差值表达式</h1>
    <h3>{{ msg }}</h3>
    <h3>{{ count }}</h3>
    <h1>v-text</h1>
    <div v-text="msg"></div>
    <h1>v-model</h1>
    <input type="text" v-model="msg">
    <input type="text" v-model="count">
  </div>
+ <script src="./js/vue.js"></script>
  <script>
    let vm = new Vue({
      el: '#app',
      data: {
        msg: 'Hello Vue',
        count: 1
      }
    })
  </script>
</body>
</html>
```

```javascript
// js/vue.js
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
    // 4. 调用 compiler 对象，解析指令和差值表达式
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
```

### 实现 Observer

- 功能
    - 负责把 `data` 选项中的属性转换成响应式数据
    - `data` 中的某个属性也是对象，把该属性转换成响应式数据（递归遍历判断处理）
    - 数据变化发送通知（结合观察者模式实现）
- 结构

![image](https://s3.ax1x.com/2020/12/18/rY9Qt1.png)

`walk` 方法是遍历 `data` 成员，在遍历的过程中会调用 `defineReactive` 方法将成员转换为响应式数据。`defineReactive` 方法的核心是调用 `Object.defineProperty()` 方法将数据转换为 `getter/setter`。

```javascript
// js/observer.js
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
    Object.defineProperty(obj, key, {
      enumerable: true, // 可枚举的
      configurable: true, // 可配置的
      get () {
        return val  // 这里为什么使用 val 而不是 obj[key] 是有原因的，看下面小节
      },
      set (newValue) {
        if (newValue === val) {
          return
        }
        val = newValue
        // 发送通知
      }
    })
  }
}
```

上面的 `observer.js` 还有一些问题还没解决，等下一步会解决。

回到 `Vue` 类中来，在 `Vue` 类构造函数中实例化 `Observer` 对象，将 `$data` 成员转换为 `getter/setter`。

```diff
// js/vue.js
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
+   new Observer(this.$data)
    // 4. 调用 compiler 对象，解析指令和差值表达式
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
```

`index.html` 中引入的 `vue.js` 依赖于 `observer.js`，所以 `observer.js` 需要比 `vue.js` 先引入。

```diff
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>实现 Vue</title>
</head>
<body>
  <div id="app">
    <h1>差值表达式</h1>
    <h3>{{ msg }}</h3>
    <h3>{{ count }}</h3>
    <h1>v-text</h1>
    <div v-text="msg"></div>
    <h1>v-model</h1>
    <input type="text" v-model="msg">
    <input type="text" v-model="count">
  </div>
+ <script src="./js/observer.js"></script>
  <script src="./js/vue.js"></script>
  <script>
    let vm = new Vue({
      el: '#app',
      data: {
        msg: 'Hello Vue',
        count: 1
      }
    })
  </script>
</body>
</html>
```

在浏览器打开 `html` 页面，在 `Console` 控制台中输入 `vm`，可以看到输出的 `Vue` 实例对象的 `$data` 成员里的属性成员都被转换为 `setter/getter` 了。

![image](https://s3.ax1x.com/2020/12/18/rY1fUI.png)

#### 为什么 defineReactive 方法要传入 val

因为不使用传入的 `val` 值，而是**用 `obj[key]` 进行返回的话会报错**。因为会触发同一个对象 `obj` 的 `getter` 方法，从而发生死递归。

```diff
Object.defineProperty(obj, key, {
  enumerable: true, // 可枚举的
  configurable: true, // 可配置的
  get () {
-   return val  // 这里为什么使用 val 而不是 obj[key] 是有原因的，看下面小节
+   return obj[key]
  },
  set (newValue) {
    if (newValue === val) {
      return
    }
    val = newValue
    // 发送通知
  }
})
```

当执行 `console.log(vm.msg)` 时会读取挂载在 `Vue` 实例的 `msg` 属性，实际上返回的是 `$data` 中的 `msg` 成员，这时候因为 `$data` 中的 `msg` 具有 `setter` 方法，上面代码中不用 `val` 而用 `obj[key]` 的话（这里 `obj` 就是 `$data`，`key` 是 `msg`），则会又访问 `$data` 中的 `msg` 从而触发 `getter`，这样会发生循环递归，抛出堆栈溢出的报错。

```bash
Uncaught RangeError: Maximum call stack size exceeded
```

#### 对象成员转换为响应式数据

- `data` 中原有的对象成员
    - 假设 `data` 中有个属性成员是对象，则需要对这个对象进行遍历，将这个对象的成员转换为响应式数据。

```diff
  // js/observer.js
  
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
    
+     // 如果 val 是对象，把 val 内部的属性转换为响应式数据
+     this.walk(val)
      
      Object.defineProperty(obj, key, {
        enumerable: true, // 可枚举的
        configurable: true, // 可配置的
        get () {
          return obj[key]  // 这里为什么使用 val 而不是 obj[key] 是有原因的，看下面章节
        },
        set (newValue) {
          if (newValue === val) {
            return
          }
          val = newValue
          // 发送通知
        }
      })
    }
  }
```

- 修改 `data` 中的属性成员值为新对象
    - 假设修改 `data` 成员，重新赋值为一个对象，那么这个对象的成员数据也应该是响应式的。

```diff
  // js/observer.js
  
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
+     const that = this
      // 如果 val 是对象，把 val 内部的属性转换为响应式数据
      this.walk(val)

      Object.defineProperty(obj, key, {
        enumerable: true, // 可枚举的
        configurable: true, // 可配置的
        get () {
          return obj[key]  // 这里为什么使用 val 而不是 obj[key] 是有原因的，看下面章节
        },
        set (newValue) {
          if (newValue === val) {
            return
          }
          val = newValue
+         that.walk(newValue)   // 这里不能用 this，因为 setter 里面 this 指向的是 'data'，这里是 obj
          // 发送通知
        }
      })
    }
  }
```

### 完整的 observer.js

```javascript
// js/observer.js

class Observer {
  constructor (data) {
    this.walk(data)
  }
  // 遍历 data，将 data 对象的属性成员转换为响应式数据
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
    // 如果 val 是对象，把 val 内部的属性转换为响应式数据
    this.walk(val)

    Object.defineProperty(obj, key, {
      enumerable: true, // 可枚举的
      configurable: true, // 可配置的
      get () {
        return obj[key]  // 这里为什么使用 val 而不是 obj[key] 是有原因的，看下面章节
      },
      set (newValue) {
        if (newValue === val) {
          return
        }
        val = newValue
        that.walk(newValue)
        // 发送通知
      }
    })
  }
}
```

### 实现 Compiler

- 功能
    - 负责编译模板，解析指令/插值表达式
    - 负责页面的首次渲染
    - 当数据变化后重新渲染视图（这里为了简化直接操作 `DOM`，没有使用虚拟 `DOM`）
- 结构

![image](https://s3.ax1x.com/2020/12/18/rY65i6.png)

- el
    - `el` 属性是 `options.el` 传过来的，需要转换为 `DOM` 对象储存起来，后面会用这个 `DOM` 对象，因为这个 `DOM` 对象是模板
- vm
    - `vm` 是 `Vue` 的实例，后面的方法需要用到 `Vue` 实例
- compile(el)
    - 内部需要判断传过来的 `DOM` 对象，遍历 `DOM` 对象的节点，对节点进行判断。如果是文本节点则解析差值表达式，如果是元素节点则解析指令
- compileElement(node)
    - 对元素节点解析指令
- compileText(node)
    - 对文本节点解析差值表达式
- isDirective(attrName)
    - 判断当前属性是否是指令，在 `compileElement(node)` 方法内进行调用
- isTextNode(node)
    - 判断节点是否是文本节点
- isElementNode(node)
    - 判断节点是否是元素节点  
    

#### compile 方法

`isDiretive` 方法、`isTextNode` 方法、`isElement` 方法相对来说比较容易实现，所以这里一起实现。

```javascript
class Compiler {
  constructor (vm) {
    this.el = vm.$el
    this.vm = vm
    // 实例化 Compiler 对象时调用 compile 方法
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

  }
  // 编译文本节点，处理差值表达式
  compileText (node) {
 
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
```

在 `html` 文件中引入 `compiler.js` 并且在 `vue` 类中实例化 `Compiler` 对象。

```diff
  <!-- index.html -->
  
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>实现 Vue</title>
  </head>
  <body>
    <div id="app">
      <h1>差值表达式</h1>
      <h3>{{ msg }}</h3>
      <h3>{{ count }}</h3>
      <h1>v-text</h1>
      <div v-text="msg"></div>
      <h1>v-model</h1>
      <input type="text" v-model="msg">
      <input type="text" v-model="count">
    </div>
+   <script src="./js/compiler.js"></script>
    <script src="./js/observer.js"></script>
    <script src="./js/vue.js"></script>
    <script>
      let vm = new Vue({
        el: '#app',
        data: {
          msg: 'Hello Vue',
          count: 1
        }
      })
    </script>
  </body>
  </html>
```

```diff
  // js/vue.js
  
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
+     new Compiler(this)
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
```

#### 实现 compileText

```javascript
class Compiler {
  ...
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
    }
  }
  ...
}
```

#### 实现 compileElement

`compileElement` 方法作用是编译元素节点，处理指令。

通过分析指令代码可以知道指令就是元素节点的属性，是以 `v-` 开头的属性。所以我们需要遍历元素节点的所有属性节点找到以 `v-` 开头的属性节点，然后再进行处理。在处理的过程中，需要知道指令的名称，指令的名称就代表要实现的功能。还要知道属性节点对应的值，也就是属性节点关联的数据，最终需要将数据展示到指令对应的位置中。

下面模拟处理 `v-text`、`v-model` 两个指令。

先尝试打印一下元素节点的 `attributes`，尝试查看结构。

```diff
  // js/compiler.js 
  
  class Compiler {
    ...
    // 编译元素节点，处理指令
    compileElement (node) {
+     console.log(node.attributes)  // 打印节点属性
    }
    ...
  }
```

可以看到元素节点的 `attributes` 是一个属性节点伪数组，其中某个元素节点仅有一个属性节点：

![image](https://s3.ax1x.com/2020/12/19/rNm6k6.png)

展开属性节点伪数组中的第一个元素可以看到这个元素对象中有 `name` 和 `value` 值，这样一来我们在遍历属性节点的时候就可以根据 `name` 和 `value` 获取属性名和属性值了。

![image](https://s3.ax1x.com/2020/12/19/rNnDgg.png)

```javascript
// js/compiler.js

class Compiler {
  ...
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
    updaterFn && updaterFn(node, this.vm[key])
  }
  // 处理 v-text
  textUpdater (node, value) {
    node.textContent = value
  }
  // 处理 v-model
  modelUpdater (node, value) {
    node.value = value
  } 
  // 处理其他指令往后增加处理函数即可
  ...
}
```

这样一来，已经实现了在页面首次渲染的时候将数据更新到视图，但响应式处理还没实现，当数据更新还不能自动更新视图。接下里实现 `Vue` 的响应式机制。

### 实现 Dep (Dependency) 类

![image](https://s3.ax1x.com/2020/12/19/rNGCNj.png)

`Dep` 的作用是收集依赖。每一个响应式数据将来都会创建一个 `Dep` 对象，它负责收集所有依赖该属性的地方。所有依赖该属性的位置都会创建一个 `Watcher` 对象，所以 `Dep` 收集的是依赖于该属性的 `Watcher` 对象。`setter` 方法中会通知依赖，当属性的值发生变化的时候，会调用 `Dep` 的 `notify` 发送通知调用 `Watcher` 的 `update` 方法。

通过上面的分析可以知道 `Dep` 的功能就是在 `getter` 中收集依赖，添加 `Watcher` 观察者，在 `setter` 中去通知依赖然后通知观察者。

- 功能
    - 收集依赖，添加观察者(`watcher`)
    - 通知所有观察者
- 结构

![image](https://s3.ax1x.com/2020/12/19/rNJFde.png)

下面来实现 `Dep` 类：

```javascript
// js/dep.js

class Dep {
  constructor () {
    // 存储所有的观察者
    this.subs = []
  }
  // 添加观察者
  addSub (sub) {
    if (sub && sub.update) {
      this.subs.push(sub)
    }
  }
  // 发送通知
  notify () {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
}
```

`Dep` 类的作用是收集依赖和发送通知。我们需要**为每一个响应式数据创建一个 `Dep` 对象**，**在使用响应式数据的时候收集依赖**，**也就是添加 `Watcher` 观察者对象**。当数据变化的时候去通知所有的观察者，调用观察者的 `update` 方法去更新视图，所以我们应该在 `Observer` 类中创建 `Dep` 对象。

```diff
  // js/observer.js
  
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
+     // 负责收集依赖，并发送通知
+     const dep = new Dep()
      // 如果 val 是对象，把 val 内部的属性转换为响应式数据
      this.walk(val)

      Object.defineProperty(obj, key, {
        enumerable: true, // 可枚举的
        configurable: true, // 可配置的
        get () {
          return val  // 这里为什么使用 val 而不是 obj[key] 是有原因的，看下面章节
        },
        set (newValue) {
          if (newValue === val) {
            return
          }
          val = newValue
          that.walk(newValue)
          // 发送通知
+         dep.notify()
        }
      })
    }
  }
```

那么在哪里收集依赖呢？收集依赖就是将观察者对象收集到 `Dep` 的 `subs` 属性中去。这个比较特殊，下面先把代码实现，先实现 `Watcher` 类，再回头来看。

我们需要在 `getter` 方法中去做这个事情，当访问属性的值的时候去收集依赖。收集依赖的时候需要判断 `Dep` 这个类有没有设置 `target` 静态属性，`target` 也就是观察者对象。之前在定义 `Dep` 类的时候并没有给 `Dep` 设置 `target` 静态属性。`target` 这个属性其实是在 `Watcher` 对象中为 `Dep` 添加的。我们在写 `Watcher` 类的时候在回过头来看一下这个事情。

```diff
  // js/observer.js
  
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
+         // 收集依赖（Watcher 实例化的时候会把自己添加到 Dep 的 target 静态属性中去）
+         Dep.target && dep.addSub(Dep.target)
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
```

### 实现 Watcher 类

![image](https://s3.ax1x.com/2020/12/19/rNUi6I.png)

在 `Data` 成员的 `getter` 方法中通过 `Dep` 对象收集依赖，在 `Data` 成员的 `setter` 方法中通过 `Dep` 对象触发依赖，所以 `Data` 中的每一个属性都要创建一个 `Dep` 对象。在收集依赖的时候要将所有的依赖，也就是所有的 `watcher` 添加到 `Dep` 对象的 `subs` 数组中。

在 `setter` 方法中触发依赖，也就是触发 `Dep` 对象发送通知，`Dep` 对象会调用 `notify` 方法去通知所有的 `watcher`， 
`watcher` 的 `update` 方法负责去更新对应的视图。

- 功能
    - 当数据变化触发依赖，`dep` 通知所有的 `Watcher` 实例更新视图
    - `Watcher` 自身实例化的时候往 `dep` 对象中添加自己
- 结构

![image](https://s3.ax1x.com/2020/12/19/rNaaa8.png)

- update
    - `update` 是 `Watcher` 对象一定要有的方法，用来更新视图
- cb
    - 因为有很多 `Watcher` 对象，更新视图的方法也不一样，所以用 `cb` 接收回调函数。当 `new Watcher` 的时候需要传入一个回调函数，用来指明如何更新视图
- key
    - 在更新视图时需要的数据，`key` 是 `data` 中的属性名称
- vm
    - `Vue` 实例，配合 `key` 获取对应的值 `vm[key]`
- oldValue
    - 数据变化之前的值，`update` 方法 可以获取到最新的值，与数据变化之前的值比较来判断是否更新视图。但数据变化的时候才去调用 `cb` 回调函数去更新视图

下面来实现 `Watcher` 类：

```javascript
// js/watcher.js

class Watcher {
  constructor (vm, key, cb) {
    // Vue 实例对象
    this.vm = vm
    // data 中的属性名称
    this.key = key
    // 回调函数负责更新视图
    this.cb = cb

    // 记录实例化 Watcher 对象时观察的属性值
    this.oldValue = vm[key]
  }
  // 当数据发生变化的时候更新视图
  update () {
    // 因为当 update 方法被调用时已经是触发了属性的 setter 方法了，可以拿到最新的值
    const newValue = this.vm[this.key]
    // 对比旧值和新值
    if (this.oldValue === newValue) {
      return
    }
    // 此时的新值变成下一次比较的旧值
    this.oldValue = newValue
    // 调用回调函数更新视图
    this.cb(newValue)
  }
}
```

这样一来数据变化更新视图功能实现了，还缺一个在实例化 `Watcher` 的时候将自身添加到 `dep.subs` 数组中去的实现。下面来实现：

```diff
  // js/watcher.js
  
  class Watcher {
    constructor (vm, key, cb) {
      // Vue 实例对象
      this.vm = vm
      // data 中的属性名称
      this.key = key
      // 回调函数负责更新视图
      this.cb = cb

+     // 把 Watcher 实例对象记录到 Dep 类的静态属性 target
+     Dep.target = this
+     // 这里要触发 getter 方法，在 getter 方法内会调用 addsub 方法
+     // 将记录在 Dep.target 的 Watcher 实例对象添加到 dep.subs 数组中
+     // 刚好下面代码在获取观察的属性值的时候触发了 getter 方法中的 dep.addsub(Dep.target)

-     // 记录实例化 Watcher 对象时观察的属性值
+     // 触发一次 getter，让 dep 为当前 key 记录 watcher
      this.oldValue = vm[key]

+     // 释放 Dep.target
+     Dep.target = null
    }
    // 当数据发生变化的时候更新视图
    update () {
      // 因为当 update 方法被调用时已经是触发了属性的 setter 方法了，可以拿到最新的值
      const newValue = this.vm[this.key]
      // 对比旧值和新值
      if (this.oldValue === newValue) {
        return
      }
      // 此时的新值变成下一次比较的旧值
      this.oldValue = newValue
      // 调用回调函数更新视图
      this.cb(newValue)
    }
  }
```

接下来看一下什么时候创建 Watcher 类对象。

#### 创建 Watcher 实例对象

回顾一下 `watcher` 的作用，有两个作用：

- 要把 `watcher` 对象添加到 `dep.subs` 中，已经通过下列代码完成

```javascript
// 把 Watcher 实例对象记录到 Dep 类的静态属性 target
Dep.target = this
// 这里要触发 getter 方法，在 getter 方法内会调用 addsub 方法
// 将记录在 Dep.target 的 Watcher 实例对象添加到 dep.subs 数组中
// 刚好下面代码在获取观察的属性值的时候触发了 getter 方法中的 dep.addsub(Dep.target)

// 记录实例化 Watcher 对象时观察的属性值
this.oldValue = vm[key]

// 释放 Dep.target
Dep.target = null
```

- 当属数据变化时更新视图

当数据变化时会在 `Observer` 类 `defineReactive` 方法中触发对象属性的 `setter` 方法调用 `dep.notify` 方法发送通知，在 `notify` 方法中会遍历所有 `watcher` 对象，调用 `watcher` 对象的 `update` 方法更新视图。

我们的指令和差值表达式都是依赖数据的，那么视图中所有依赖数据的地方都需要添加 `watcher` 对象。当数据改变的时候，`dep` 对象会通知所有的 `watcher` 对象重新渲染视图，所以我们需要在 `Compiler` 类中操作 `DOM` 的 `textUpdater`、`modelUpdater`、`compileText` 三个方法中来创建 `watcher` 对象。

```diff
  // js/compiler.js

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
-     updaterFn && updaterFn(node, this.vm[key], key)
+     /**
+      * 这里需要注意的是，这里调用 updateFn 方法也就是调用 textUpdater 方法时，
+      * textUpdater 方法内部的 this 指向的并不是 Compiler 实例对象，
+      * 需要用 call 来改变 this 指向，以便于 new Watcher 的时候使用
+      */ 
+     updaterFn && updaterFn.call(this, node, this.vm[key], key)
    }
    // 处理 v-text
-   textUpdater (node, value) {
+   textUpdater (node, value, key) {
      node.textContent = value
+     new Watcher(this.vm, key, (newValue) => {
+       node.textContent = newValue
+     })
    }
    // 处理 v-model
-   modelUpdater (node, value) {
+   modelUpdater (node, value, key) {
      node.value = value
+     new Watcher(this.vm, key, (newValue) => {
+       node.value = newValue
+     })
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
```

将 `dep.js` 和 `watcher.js` 引入 `html` 中：

```diff
  <!-- index.html -->
  
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>实现 Vue</title>
  </head>
  <body>
    <div id="app">
      <h1>差值表达式</h1>
      <h3>{{ msg }}</h3>
      <h3>{{ count }}</h3>
      <h1>v-text</h1>
      <div v-text="msg"></div>
      <h1>v-model</h1>
      <input type="text" v-model="msg">
      <input type="text" v-model="count">
    </div>
+   <script src="./js/dep.js"></script>
+   <script src="./js/watcher.js"></script>
    <script src="./js/compiler.js"></script>
    <script src="./js/observer.js"></script>
    <script src="./js/vue.js"></script>
    <script>
      let vm = new Vue({
        el: '#app',
        data: {
          msg: 'Hello Vue',
          count: 1
        }
      })
    </script>
  </body>
  </html>
```

在浏览器打开页面，打开 `Console` 控制台，输入 `vm.msg = '123'`，发现页面中差值表达式和指令的数据都更新了。

还有一个问题就是双向绑定，输入框的双向绑定还没实现，下面来模拟实现。

#### 实现双向绑定

双向绑定机制包含两个特点：

- 数据发生变化更新视图
- 视图发生变化更新数据

上面第一个特点已经是实现，下面来分析实现第二个特点，视图发生变化更新数据。

当文本框的数据发生变化的时候会触发一个相对应的事件，原版的 `Vue` 中使用的是 `input` 事件，此处我们也使用 `input` 事件。当这个事件发生的时候，我们要把文本框的值取出来重新赋给对应绑定的响应式数据。

```diff
  // js/compiler.js
  
  class Compiler {
    ...
    // 处理 v-model
    modelUpdater (node, value, key) {
      node.value = value
      new Watcher(this.vm, key, (newValue) => {
        node.value = newValue
      })
+     // 双向绑定
+     node.addEventListener('input', () => {
+       this.vm[key] = node.value
+     })
    }
    ...
  }
```

上述代码就实现了双向绑定机制了。

### 总结

- 问题
    - 给属性重新赋值成对象，是否是响应式的？答：是响应式的，因为会在 `setter` 的时候调用 `this.walk` 方法从而调用 `defineReactive` 方法
    - 给 `Vue` 实例新增一个成员是否是响应式的？答：非响应式的，因为响应式数据转换是在 `new Vue` 实例对象的时候完成的
        - `Vue.set(object, propertyName, value)` 和 `this.$set(object, propertyName, value)` 内部使用了 `defineReactive` 方法将数据定义为响应式数据
- 通过下图回顾整体流程

![image](https://s3.ax1x.com/2020/12/19/rN48Df.png)

- Vue
    - 记录传入的选项，设置 `$data/$el`
    - 把 `data` 的成员注入到 `Vue` 实例
    - 负责调用 `Observer` 实现数据响应式处理（数据劫持）
    - 负责调用 `Compiler` 编译指令/插值表达式等
- Observer
    - 数据劫持
    - 负责把 `data` 中的成员转换成 `getter/setter`
    - 负责把多层属性转换成 `getter/setter`
    - 如果给属性赋值为新对象，把新对象的成员设置为 `getter/setter`
    - 添加 `Dep` 和 `Watcher` 的依赖关系
    - 数据变化发送通知
- Compiler
    - 负责编译模板，解析指令/插值表达式
    - 负责页面的首次渲染过程
    - 当数据变化后重新渲染
- Dep
    - 收集依赖，添加订阅者(`watcher`)
    - 通知所有订阅者
- Watcher
    - 自身实例化的时候往 `dep` 对象中添加自己
    - 当数据变化 `dep` 通知所有的 `Watcher` 实例更新视图