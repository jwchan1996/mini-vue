class Dep {
  constructor() {
    // 储存所有观察者
    this.subs = []
  }
  // 添加观察者
  addSub (sub) {
    if (sub && sub.update) {
      this.subs.push(sub)
    }
  }
  // 发送通知，通知所有观察者（调用观察者的 update方法)
  notify () {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
}