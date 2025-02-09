console.log("chzzk filter activated")

chrome.storage.sync.get(['streamerNames'], function (result) {
  console.log('filtered streamer : ', result.streamerNames)
})

// 필터링 함수
function filterStreamers() {
  chrome.storage.sync.get(['streamerNames'], function (result) {
    const streamerNames = new Set(result.streamerNames || [])
    if (streamerNames.size > 0) {
      const listItems = document.querySelectorAll('li')
      listItems.forEach(function (item) {
        const streamerName = item.querySelector('.video_card_name__Y3icO .name_text__yQG50')?.textContent
        if (streamerNames.has(streamerName)) {
          item.remove()
        }
      })
    }
  })
}

// 초기 로드 시 필터링 적용
filterStreamers()

// 동적 콘텐츠 감시를 위한 MutationObserver
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1 && node.matches('li')) {
        filterStreamers() // 새로운 <li>가 추가될 때마다 필터링 적용
      }
    })
  })
})

// body 요소 감시 시작
observer.observe(document.body, { childList: true, subtree: true })
