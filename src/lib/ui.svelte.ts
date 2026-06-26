// 사이드바 열림/닫힘 같은 순수 UI 상태 (북마크 데이터와 무관).
class UI {
  sidebarOpen = $state(true)

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen
  }
}

export const ui = new UI()
