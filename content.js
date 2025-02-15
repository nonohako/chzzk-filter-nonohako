console.log("chzzk filter activated")

document.querySelector('body').insertAdjacentHTML('beforeend', `
<div id="custom-context-menu" style="display: none; position: absolute; background-color: black; border: 2px solid green; padding: 10px; box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);">
    
</div>`)

let removes = []
let removeSet = new Set()

function filterStreamers() {
  chrome.storage.sync.get(['streamerNames', 'tags'], function (result) {
    const streamerNames = new Set(result.streamerNames || [])
    const tags = new Set(result.tags || [])
    document.querySelectorAll('li').forEach(function (node) {
      const streamerName = node.querySelector('.name_text__yQG50')?.textContent
      if (streamerNames.has(streamerName)) {
        node.style.visibility = 'hidden'
        if (!removeSet.has(node)) {
          removeSet.add(node)
          removes.push(node)
        }
      } else {
        const tagNodes = node.querySelectorAll('.video_card_category__xQ15T')
        if (tagNodes.length > 0) {
          const ownTags = Array.from(tagNodes).map(node => node.textContent)
          if (ownTags.some(tag => tags.has(tag))) {
            node.style.visibility = 'hidden'
            if (!removeSet.has(node)) {
              removeSet.add(node)
              removes.push(node)
            }
          }
        }
      }

    })
  })
}
function handleFilterItem(value, type){
  chrome.storage.sync.get(['streamerNames', 'tags'], function(result) {
    const streamerNames = result.streamerNames ?? []
    const tags = result.tags ?? []
    switch(type) {
      case 'streamerName': {
        if (!streamerNames.includes(value)) {
          streamerNames.push(value)
          chrome.storage.sync.set({ 'streamerNames': streamerNames }, filterStreamers)
        }
        break
      }
      case 'tag': {
        if (!tags.includes(value)) {
          tags.push(value)
          chrome.storage.sync.set({ 'tags': tags }, filterStreamers)
        }
        break
      }
    }

  })
}

function handleCustomMenu(e) {
  e.preventDefault()
  chrome.storage.sync.get(['streamerNames', 'tags'], (result) => {
    const customMenu = document.getElementById('custom-context-menu')
    customMenu.style.display = 'block'
    customMenu.style.left = `${e.pageX}px`
    customMenu.style.top = `${e.pageY}px`
    customMenu.innerHTML = ''

    // 스트리머명 차단
    const streamerName = this.querySelector('.name_text__yQG50')?.textContent
    const streamerBlockDiv = document.createElement('div')
    streamerBlockDiv.textContent = `${streamerName} 차단`
    streamerBlockDiv.style.color = 'green'
    streamerBlockDiv.style.cursor = 'pointer'
    streamerBlockDiv.style.fontFamily = 'Arial, sans-serif'
    streamerBlockDiv.style.fontSize = '14px'
    streamerBlockDiv.addEventListener('click', () => handleFilterItem(streamerName, 'streamerName'))
    customMenu.appendChild(streamerBlockDiv)

    // 태그 차단
    const tagNodes = this.querySelectorAll('.video_card_category__xQ15T')
    if (tagNodes.length > 0) {
      const ownTags = Array.from(tagNodes).map(node => node.textContent)
      for (const tag of ownTags) {
        const tagBlockDiv = document.createElement('div')
        tagBlockDiv.textContent = `${tag} 태그 차단`
        tagBlockDiv.style.color = 'green'
        tagBlockDiv.style.cursor = 'pointer'
        tagBlockDiv.style.fontFamily = 'Arial, sans-serif'
        tagBlockDiv.style.fontSize = '14px'
        tagBlockDiv.addEventListener('click', () => handleFilterItem(tag, 'tag'))
        customMenu.appendChild(tagBlockDiv)
      }
    }
  })
}
document.addEventListener('click', function (event) {
  const customMenu = document.getElementById('custom-context-menu')
  if (customMenu.style.display === 'block') {
    customMenu.style.display = 'none'
  }
})

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.matches('li')) {
        filterStreamers() // 새로운 <li>가 추가될 때마다 필터링 적용
        node.addEventListener('contextmenu', handleCustomMenu)
        removeSet.forEach(node => node.remove())
        removes = []
        removeSet = new Set()
      }
    })
  })
})

// body 요소 감시
observer.observe(document.body, {childList: true, subtree: true})

