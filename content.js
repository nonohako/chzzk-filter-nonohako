console.log("chzzk filter activated")

function filterStreamers() {
  chrome.storage.sync.get(['streamerNames'], function (result) {
    const streamerNames = new Set(result.streamerNames || [])
    if (streamerNames.size > 0) {
      document.querySelectorAll('li').forEach(function (node) {
        const streamerName = node.querySelector('.name_text__yQG50')?.textContent
        if (streamerNames.has(streamerName)) {
          node.remove()
        }
      })
    }

  })
}


const observer = new MutationObserver((mutations) => {
  setTimeout(() => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.matches('li')) {
          filterStreamers() // 새로운 <li>가 추가될 때마다 필터링 적용
        }
      })
    })
  }, 70)
})

// body 요소 감시
observer.observe(document.body, {childList: true, subtree: true})

