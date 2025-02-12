console.log("chzzk filter activated")

function filterStreamers() {
  chrome.storage.sync.get(['streamerNames', 'tags'], function (result) {
    const streamerNames = new Set(result.streamerNames || [])
    const tags = new Set(result.tags || [])
    document.querySelectorAll('li').forEach(function (node) {
    const streamerName = node.querySelector('.name_text__yQG50')?.textContent
    if (streamerNames.has(streamerName)) {
      node.style.visibility = 'hidden'
    } else {
      const tagNodes = node.querySelectorAll('.video_card_category__xQ15T')
      if (tagNodes.length > 0) {
        const ownTags = Array.from(tagNodes).map(node => node.textContent)
        if (ownTags.some(tag => tags.has(tag))) {
          node.style.visibility = 'hidden'
        }
      }
    }

    })

  })
}


const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.matches('li')) {
        filterStreamers() // 새로운 <li>가 추가될 때마다 필터링 적용
      }
    })
  })
})

// body 요소 감시
observer.observe(document.body, {childList: true, subtree: true})

