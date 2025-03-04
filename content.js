console.log("chzzk filter activated")
console.log("source code link: https://github.com/nonohako/chzzk-filter-nonohako")
const delay = 12 / navigator.hardwareConcurrency * 200
console.log('delay', delay)

// 컨텍스트 메뉴 스타일 개선
document.querySelector('body').insertAdjacentHTML('beforeend', `
<div id="custom-context-menu" style="display: none; position: absolute; background-color: #252525; border: 1px solid #333; border-radius: 8px; padding: 0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); z-index: 9999; min-width: 180px; overflow: hidden;">
</div>`)

// Storage API 래퍼 함수들
function getStorageData(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

function setStorageData(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// 데이터 처리 유틸리티 함수들
async function getStreamerData() {
  try {
    const result = await getStorageData(['streamerData']);
    return result.streamerData || [];
  } catch (error) {
    console.error('스트리머 데이터 로드 실패:', error);
    return [];
  }
}

async function getTagData() {
  try {
    const result = await getStorageData(['tags']);
    return result.tags || [];
  } catch (error) {
    console.error('태그 데이터 로드 실패:', error);
    return [];
  }
}

async function updateStreamerData(streamerData) {
  try {
    await setStorageData({ streamerData });
    return true;
  } catch (error) {
    console.error('스트리머 데이터 업데이트 실패:', error);
    return false;
  }
}

async function updateTagData(tags) {
  try {
    await setStorageData({ tags });
    return true;
  } catch (error) {
    console.error('태그 데이터 업데이트 실패:', error);
    return false;
  }
}

// 스트리머 필터링 함수
async function filterStreamers() {
  try {
    const streamerData = await getStreamerData();
    const tags = await getTagData();
    
    const streamerNames = new Set(streamerData.map(item => item.name));
    const streamerIds = new Set(streamerData.filter(item => item.id).map(item => item.id));
    const tagSet = new Set(tags);
    
    const streamerCards = document.querySelectorAll('li');
    
    streamerCards.forEach((node) => {
      try {
        const streamerName = node.querySelector('.name_text__yQG50')?.textContent;
        
        // 스트리머 ID 추출
        let streamerId = null;
        const channelLink = node.querySelector('a[href*="/channel/"]');
        if (channelLink) {
          const match = channelLink.getAttribute('href').match(/\/channel\/([^\/]+)/);
          if (match && match[1]) {
            streamerId = match[1];
          }
        }
        
        if (!streamerId) {
          const cardImageLink = node.querySelector('.video_card_image__yHXqv');
          if (cardImageLink) {
            const href = cardImageLink.getAttribute('href');
            if (href && href.startsWith('/')) {
              streamerId = href.substring(1);
            }
          }
        }
        
        // 스트리머 이름이나 ID로 차단
        if ((streamerName && streamerNames.has(streamerName)) || 
            (streamerId && streamerIds.has(streamerId))) {
          node.style.display = 'none';
        } else {
          // 태그로 차단
          const tagNodes = node.querySelectorAll('.video_card_category__xQ15T');
          if (tagNodes.length > 0) {
            const ownTags = Array.from(tagNodes).map(node => node.textContent);
            if (ownTags.some(tag => tagSet.has(tag))) {
              node.style.display = 'none';
            }
          }
        }
      } catch (nodeError) {
        console.error('Node processing error:', nodeError);
      }
    });
  } catch (error) {
    console.error('filterStreamers error:', error);
  }
}

// 태그 필터링 함수
async function filterTags(tagName) {
  try {
    const tags = await getTagData();
    return tags.includes(tagName);
  } catch (error) {
    console.error('태그 필터링 실패:', error);
    return false;
  }
}

// 메인 처리 함수
async function processStream(streamData) {
  try {
    const isBlocked = await filterStreamers(streamData.streamerId);
    const hasBlockedTag = await filterTags(streamData.tag);
    
    return isBlocked || hasBlockedTag;
  } catch (error) {
    console.error('스트림 처리 실패:', error);
    return false;
  }
}

async function handleFilterItem(value, type, streamerId = null) {
  try {
    // 스토리지 데이터 가져오기
    const result = await getStorageData(['streamerData', 'tags']);
    
    const streamerData = result.streamerData || [];
    const tags = result.tags || [];
    
    switch (type) {
      case 'streamerName': {
        const existingIndex = streamerData.findIndex(item => item.name === value);
        if (existingIndex === -1) {
          const newStreamerData = {
            name: value,
            id: streamerId,
            blockedAt: new Date().toISOString(),
            order: streamerData.length
          };
          streamerData.push(newStreamerData);
          await setStorageData({streamerData});
          await filterStreamers();
        }
        break;
      }
      case 'tag': {
        if (!tags.includes(value)) {
          tags.push(value);
          await setStorageData({tags});
          await filterStreamers();
        }
        break;
      }
    }
  } catch (error) {
    console.error('handleFilterItem error:', error);
  }
}

// 컨텍스트 메뉴 스타일 개선
function handleCustomMenu(e) {
  // 스트리머명 먼저 조회
  const streamerName = this.querySelector('.name_text__yQG50')?.textContent
  if (!streamerName) {
    return
  }
  
  // 스트리머 ID 추출 시도 (개선된 방식)
  let streamerId = null
  
  // 방법 1: /channel/ 경로가 포함된 링크에서 추출
  const channelLink = this.querySelector('a[href*="/channel/"]')
  if (channelLink) {
    const href = channelLink.getAttribute('href')
    const match = href.match(/\/channel\/([^\/]+)/)
    if (match && match[1]) {
      streamerId = match[1]
    }
  }
  
  // 방법 2: 직접 스트리머 ID 형식의 링크에서 추출
  if (!streamerId) {
    // 모든 a 태그를 검사
    const allLinks = this.querySelectorAll('a')
    for (const link of allLinks) {
      const href = link.getAttribute('href')
      if (href) {
        // /로 시작하고 뒤에 32자 이상의 영숫자로 구성된 ID 패턴 찾기
        const directMatch = href.match(/^\/([a-zA-Z0-9]{32,})$/)
        if (directMatch && directMatch[1]) {
          streamerId = directMatch[1]
          break
        }
      }
    }
  }
  
  // 방법 3: video_card_image__yHXqv 클래스를 가진 링크에서 추출
  if (!streamerId) {
    const cardImageLink = this.querySelector('.video_card_image__yHXqv')
    if (cardImageLink) {
      const href = cardImageLink.getAttribute('href')
      if (href && href.startsWith('/')) {
        // 슬래시로 시작하는 경우 첫 문자를 제외한 나머지를 ID로 간주
        streamerId = href.substring(1)
      }
    }
  }
  
  e.preventDefault()
  const customMenu = document.getElementById('custom-context-menu')
  customMenu.style.display = 'block'
  customMenu.style.left = `${e.pageX}px`
  customMenu.style.top = `${e.pageY}px`
  customMenu.innerHTML = ''

  // 스트리머 차단 메뉴 아이템
  const streamerBlockDiv = document.createElement('div')
  streamerBlockDiv.textContent = `${streamerName} 차단`
  streamerBlockDiv.style.color = '#f0f0f0'
  streamerBlockDiv.style.cursor = 'pointer'
  streamerBlockDiv.style.fontFamily = 'Noto Sans KR, sans-serif'
  streamerBlockDiv.style.fontSize = '14px'
  streamerBlockDiv.style.padding = '10px 16px'
  streamerBlockDiv.style.borderBottom = '1px solid #333'
  streamerBlockDiv.addEventListener('click', () => {
    handleFilterItem(streamerName, 'streamerName', streamerId)
    customMenu.style.display = 'none'
  })

  // 호버 시 스타일
  streamerBlockDiv.addEventListener('mouseover', () => {
    streamerBlockDiv.style.backgroundColor = '#00c73c'
    streamerBlockDiv.style.color = 'white'
  })
  streamerBlockDiv.addEventListener('mouseout', () => {
    streamerBlockDiv.style.backgroundColor = 'transparent'
    streamerBlockDiv.style.color = '#f0f0f0'
  })

  customMenu.appendChild(streamerBlockDiv)

  // 태그 차단
  const tagNodes = this.querySelectorAll('.video_card_category__xQ15T')
  if (tagNodes.length > 0) {
    const ownTags = Array.from(tagNodes).map(node => node.textContent)
    for (const tag of ownTags) {
      const tagBlockDiv = document.createElement('div')
      tagBlockDiv.textContent = `${tag} 태그 차단`
      tagBlockDiv.style.color = '#f0f0f0'
      tagBlockDiv.style.cursor = 'pointer'
      tagBlockDiv.style.fontFamily = 'Noto Sans KR, sans-serif'
      tagBlockDiv.style.fontSize = '14px'
      tagBlockDiv.style.padding = '10px 16px'
      
      // 마지막 아이템이 아니면 경계선 추가
      if (tag !== ownTags[ownTags.length - 1]) {
        tagBlockDiv.style.borderBottom = '1px solid #333'
      }
      
      tagBlockDiv.addEventListener('click', () => {
        handleFilterItem(tag, 'tag')
        customMenu.style.display = 'none'
      })

      // 호버 시 스타일
      tagBlockDiv.addEventListener('mouseover', () => {
        tagBlockDiv.style.backgroundColor = '#00c73c'
        tagBlockDiv.style.color = 'white'
      })
      tagBlockDiv.addEventListener('mouseout', () => {
        tagBlockDiv.style.backgroundColor = 'transparent'
        tagBlockDiv.style.color = '#f0f0f0'
      })

      customMenu.appendChild(tagBlockDiv)
    }
  }
}

// 컨텍스트 메뉴 닫기
document.addEventListener('click', (e) => {
  const customMenu = document.getElementById('custom-context-menu')
  if (customMenu.style.display === 'block' && !customMenu.contains(e.target)) {
    customMenu.style.display = 'none'
  }
})

// 초기화 함수
function init() {
  try {
    if (chrome.runtime.lastError) {
      console.log('Chrome runtime error:', chrome.runtime.lastError);
      return;
    }

    chrome.storage.local.get(['streamerNames', 'streamerData'], (result) => {
      if (chrome.runtime.lastError) {
        console.log('Storage get error:', chrome.runtime.lastError);
        return;
      }

      if (result.streamerNames && (!result.streamerData || result.streamerData.length === 0)) {
        const streamerData = result.streamerNames.map((name, index) => ({
          name,
          id: null,
          blockedAt: new Date().toISOString(),
          order: index
        }));
        
        chrome.storage.local.set({streamerData}, () => {
          if (chrome.runtime.lastError) {
            console.log('Storage set error:', chrome.runtime.lastError);
            return;
          }
          console.log('데이터 구조 업그레이드 완료');
          setTimeout(() => {
            filterStreamers();
          }, delay);
        });
      } else {
        setTimeout(() => {
          filterStreamers();
        }, delay);
      }
    });
  } catch (error) {
    console.log('init error:', error);
  }
}

init()

// DOM 변경 감시 최적화
const observer = new MutationObserver((mutations) => {
  let shouldFilter = false
  
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      // li 요소가 추가되었는지 확인
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const node = mutation.addedNodes[i]
        if (node.nodeType === 1 && (node.tagName === 'LI' || node.querySelector('li'))) {
          shouldFilter = true
          break
        }
      }
    }
  })
  
  if (shouldFilter) {
    // 모든 li 요소에 컨텍스트 메뉴 이벤트 리스너 추가
    document.querySelectorAll('li').forEach((queryNode) => {
      // 이미 이벤트 리스너가 있는지 확인하는 방법이 없으므로 모든 노드에 추가
      queryNode.addEventListener('contextmenu', handleCustomMenu)
    })
    
    filterStreamers()
  }
})

// body 요소 감시
observer.observe(document.body, {childList: true, subtree: true})

// 추천 탭 클릭 시 필터링 적용
const recommendTab = document.getElementById('RECOMMEND')
if (recommendTab) {
  recommendTab.addEventListener('click', init)
}

// 페이지 URL 변경 감지 및 필터링 적용
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    setTimeout(init, 500) // URL 변경 후 DOM이 업데이트될 시간을 주기 위해 지연
  }
}).observe(document, {subtree: true, childList: true})
