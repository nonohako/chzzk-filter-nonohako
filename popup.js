// 전역 변수로 sortState 선언
let sortState = {
  name: 'asc',
  date: 'desc',
  tagName: 'asc'
};

// 메모 관련 변수
let currentStreamer = null;
let memoPopup = null;
let memoContent = null;

// 탭 기능 구현
document.addEventListener('DOMContentLoaded', function() {
  // 탭 전환 기능
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 활성 탭 변경
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // 탭 콘텐츠 변경
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    });
  });
  
  // 초기 데이터 로드
  loadData();
  
  // 이벤트 리스너 등록
  document.getElementById('add-streamer-btn').addEventListener('click', addStreamer);
  document.getElementById('add-tag-btn').addEventListener('click', addTag);
  document.getElementById('export').addEventListener('click', exportSettings);
  document.getElementById('import').addEventListener('change', importSettings);
  
  // 정렬 기능 이벤트 리스너
  document.getElementById('sort-by-name').addEventListener('click', () => sortStreamers('name'));
  document.getElementById('sort-by-date').addEventListener('click', () => sortStreamers('date'));
  document.getElementById('sort-tag-by-name').addEventListener('click', sortTags);
  
  // 검색 기능 이벤트 리스너
  document.getElementById('streamer-search').addEventListener('input', searchStreamers);
  document.getElementById('tag-search').addEventListener('input', searchTags);
  
  // 초기 정렬 상태 표시
  updateSortButtons();
  
  // 메모 팝업 초기화
  memoPopup = document.getElementById('memo-popup');
  memoContent = document.getElementById('memo-content');
  
  // 메모 팝업 이벤트 리스너
  document.querySelector('.save-memo').addEventListener('click', saveMemo);
  document.querySelector('.cancel-memo').addEventListener('click', closeMemoPopup);
});

// 정렬 버튼 텍스트 업데이트 함수
function updateSortButtons() {
  document.getElementById('sort-by-name').textContent = 
    `이름순 정렬 ${sortState.name === 'asc' ? '↑' : '↓'}`;
  document.getElementById('sort-by-date').textContent = 
    `차단일순 정렬 ${sortState.date === 'desc' ? '↓' : '↑'}`;
  document.getElementById('sort-tag-by-name').textContent = 
    `이름순 정렬 ${sortState.tagName === 'asc' ? '↑' : '↓'}`;
}

// 스트리머 추가 함수
function addStreamer() {
  const streamerWrap = document.getElementById('streamer-wrap');
  
  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = '스트리머명을 입력하세요';
  
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const newStreamerName = this.value.trim();
      if (newStreamerName) {
        chrome.storage.local.get(['streamerData'], function(result) {
          let streamerData = result.streamerData || [];
          if (!streamerData.some(item => item.name === newStreamerName)) {
            streamerData.push({
              name: newStreamerName,
              id: null,
              blockedAt: new Date().toISOString(),
              order: streamerData.length
            });
            chrome.storage.local.set({streamerData}, () => {
              loadData();
              input.value = '';
            });
          }
        });
      }
    }
  });
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.innerHTML = '🗑️ 삭제';
  deleteButton.addEventListener('click', function() {
    inputGroup.remove();
    chrome.storage.local.get(['streamerData'], function(result) {
      const streamerData = result.streamerData || [];
      const filtered = streamerData.filter(item => item.name !== input.value);
      chrome.storage.local.set({'streamerData': filtered}, updateCounters);
    });
  });
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';
  buttonContainer.appendChild(deleteButton);
  
  inputGroup.appendChild(input);
  inputGroup.appendChild(buttonContainer);
  streamerWrap.appendChild(inputGroup);
  
  input.focus();
}

// 태그 추가 함수
function addTag() {
  const tagWrap = document.getElementById('tag-wrap');
  
  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group';
  
  const nameDiv = document.createElement('div');
  nameDiv.className = 'streamer-name';
  nameDiv.contentEditable = true;
  nameDiv.setAttribute('placeholder', '태그명을 입력하세요');
  nameDiv.addEventListener('input', function() {
    const tagName = this.textContent.trim();
    if (tagName) {
      chrome.storage.local.get(['tags'], function(result) {
        const tags = result.tags || [];
        if (!tags.includes(tagName)) {
          tags.push(tagName);
          chrome.storage.local.set({tags}, updateCounters);
        }
      });
    }
  });
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.innerHTML = '×';
  deleteButton.title = '삭제';
  deleteButton.addEventListener('click', function() {
    inputGroup.remove();
    const tagName = nameDiv.textContent.trim();
    if (tagName) {
      chrome.storage.local.get(['tags'], function(result) {
        const tags = result.tags || [];
        const filtered = tags.filter(item => item !== tagName);
        chrome.storage.local.set({tags: filtered}, updateCounters);
      });
    }
  });
  
  inputGroup.appendChild(nameDiv);
  inputGroup.appendChild(deleteButton);
  tagWrap.appendChild(inputGroup);
  
  // 포커스 설정
  nameDiv.focus();
}

// 입력값 저장 함수
function saveInputs() {
  const streamerInputs = document.querySelectorAll('#streamer-wrap input');
  const tagDivs = document.querySelectorAll('#tag-wrap .streamer-name');
  
  chrome.storage.local.get(['streamerData'], (result) => {
    let streamerData = result.streamerData || [];
    
    // 입력 필드에서 스트리머 이름 가져오기
    const currentNames = Array.from(streamerInputs)
      .map(input => input.value.trim())
      .filter(value => value !== '');
    
    // 기존 데이터에서 이름이 변경된 항목 업데이트
    streamerData = streamerData.filter(item => currentNames.includes(item.name));
    
    // 새로 추가된 이름 처리
    currentNames.forEach(name => {
      if (!streamerData.some(item => item.name === name)) {
        streamerData.push({
          name: name,
          id: null,
          blockedAt: new Date().toISOString(),
          order: streamerData.length
        });
      }
    });
    
    // 태그 처리
    const tags = Array.from(tagDivs)
      .map(div => div.textContent.trim())
      .filter(value => value !== '');
    
    chrome.storage.local.set({streamerData, tags}, updateCounters);
  });
}

// 스트리머 정렬 함수
function sortStreamers(sortBy) {
  chrome.storage.local.get(['streamerData'], (result) => {
    let streamerData = result.streamerData || [];
    
    if (sortBy === 'name') {
      streamerData.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name, 'ko');
        return sortState.name === 'asc' ? comparison : -comparison;
      });
      sortState.name = sortState.name === 'asc' ? 'desc' : 'asc';
    } else if (sortBy === 'date') {
      streamerData.sort((a, b) => {
        const comparison = new Date(b.blockedAt) - new Date(a.blockedAt);
        return sortState.date === 'desc' ? comparison : -comparison;
      });
      sortState.date = sortState.date === 'desc' ? 'asc' : 'desc';
    }
    
    // 정렬 후 순서 업데이트
    streamerData.forEach((item, index) => {
      item.order = index;
    });
    
    chrome.storage.local.set({streamerData}, () => {
      loadData();
      updateSortButtons();
    });
  });
}

// 스트리머 검색 함수
function searchStreamers() {
  const searchTerm = document.getElementById('streamer-search').value.toLowerCase();
  const streamerItems = document.querySelectorAll('#streamer-wrap .streamer-item');
  
  streamerItems.forEach(item => {
    const streamerName = item.querySelector('.streamer-name').textContent.toLowerCase();
    const streamerId = item.querySelector('.streamer-name').classList.contains('has-link') ? 
      item.querySelector('.streamer-name').getAttribute('data-id') : '';
    const memoIcon = item.querySelector('.memo-icon');
    const memoContent = memoIcon ? memoIcon.title.toLowerCase() : '';
    
    if (streamerName.includes(searchTerm) || 
        (streamerId && streamerId.toLowerCase().includes(searchTerm)) ||
        memoContent.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// 태그 검색 함수
function searchTags() {
  const searchTerm = document.getElementById('tag-search').value.toLowerCase();
  const tagItems = document.querySelectorAll('#tag-wrap .input-group');
  
  tagItems.forEach(item => {
    const tagName = item.querySelector('.streamer-name').textContent.toLowerCase();
    if (tagName.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// 태그 정렬 함수
function sortTags() {
  chrome.storage.local.get(['tags'], (result) => {
    let tags = result.tags || [];
    
    tags.sort((a, b) => {
      const comparison = a.localeCompare(b, 'ko');
      return sortState.tagName === 'asc' ? comparison : -comparison;
    });
    
    sortState.tagName = sortState.tagName === 'asc' ? 'desc' : 'asc';
    
    chrome.storage.local.set({tags}, () => {
      loadData();
      updateSortButtons();
    });
  });
}

// 날짜 포맷 함수
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 데이터 로드 함수
function loadData() {
  chrome.storage.local.get(['streamerData', 'tags'], (result) => {
    let streamerData = result.streamerData || [];
    const tags = result.tags || [];
    
    // 이전 버전 호환성 처리
    if (!streamerData.length && result.streamerNames) {
      streamerData = result.streamerNames.map((name, index) => ({
        name,
        id: null,
        blockedAt: new Date().toISOString(),
        order: index
      }));
      chrome.storage.local.set({streamerData});
    }
    
    // 스트리머 데이터 로드
    const streamerWrap = document.getElementById('streamer-wrap');
    streamerWrap.innerHTML = '';
    
    if (streamerData.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = '필터링할 스트리머가 없습니다';
      streamerWrap.appendChild(emptyState);
    } else {
      streamerData.forEach(streamer => {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group streamer-item';
        
        // 우클릭 이벤트 리스너를 input-group에 추가
        inputGroup.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          showMemoPopup(streamer, e.clientX, e.clientY);
        });
        
        // 스트리머 이름 div
        const nameDiv = document.createElement('div');
        nameDiv.className = 'streamer-name';
        nameDiv.textContent = streamer.name;
        if (streamer.id) {
          nameDiv.classList.add('has-link');
          nameDiv.title = '채널로 이동';
          nameDiv.setAttribute('data-id', streamer.id);
          nameDiv.addEventListener('click', function() {
            window.open(`https://chzzk.naver.com/${streamer.id}`, '_blank');
          });
        }
        
        // 메모 아이콘 (있는 경우)
        let memoIcon = null;
        if (streamer.memo) {
          memoIcon = document.createElement('span');
          memoIcon.className = 'memo-icon';
          memoIcon.textContent = '📝';
          memoIcon.title = streamer.memo;
          memoIcon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showMemoPopup(streamer, e.clientX, e.clientY);
          });
        }
        
        // 정보 컨테이너
        const infoDiv = document.createElement('div');
        infoDiv.className = 'streamer-info';
        
        // 차단 시간 표시
        const blockTimeSpan = document.createElement('span');
        blockTimeSpan.className = 'block-time';
        blockTimeSpan.title = '차단 시간';
        blockTimeSpan.textContent = streamer.blockedAt ? formatDate(streamer.blockedAt) : '알 수 없음';
        infoDiv.appendChild(blockTimeSpan);
        
        // 삭제 버튼
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '×';
        deleteButton.title = '삭제';
        deleteButton.addEventListener('click', function(e) {
          e.stopPropagation();
          inputGroup.remove();
          chrome.storage.local.get(['streamerData'], function(result) {
            const currentData = result.streamerData || [];
            const filtered = currentData.filter(item => item.name !== streamer.name);
            chrome.storage.local.set({'streamerData': filtered}, updateCounters);
          });
        });
        
        // 요소 추가
        inputGroup.appendChild(nameDiv);
        if (memoIcon) inputGroup.appendChild(memoIcon);
        inputGroup.appendChild(infoDiv);
        inputGroup.appendChild(deleteButton);
        streamerWrap.appendChild(inputGroup);
      });
    }
    
    // 태그 데이터 로드
    const tagWrap = document.getElementById('tag-wrap');
    tagWrap.innerHTML = '';
    
    if (tags.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = '필터링할 태그가 없습니다';
      tagWrap.appendChild(emptyState);
    } else {
      tags.forEach(tag => {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';
        
        // 태그 이름을 div로 변경
        const nameDiv = document.createElement('div');
        nameDiv.className = 'streamer-name';
        nameDiv.textContent = tag;
        
        // 삭제 버튼
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '×';
        deleteButton.title = '삭제';
        deleteButton.addEventListener('click', function() {
          inputGroup.remove();
          chrome.storage.local.get(['tags'], function(result) {
            const values = result.tags || [];
            const filtered = values.filter(item => item !== tag);
            chrome.storage.local.set({'tags': filtered}, updateCounters);
          });
        });
        
        // 요소 추가
        inputGroup.appendChild(nameDiv);
        inputGroup.appendChild(deleteButton);
        tagWrap.appendChild(inputGroup);
      });
    }
    
    // 카운터 업데이트
    updateCounters();
  });
}

// 카운터 업데이트 함수
function updateCounters() {
  chrome.storage.local.get(['streamerData', 'tags'], (result) => {
    const streamerData = result.streamerData || [];
    const tags = result.tags || [];
    
    document.getElementById('streamer-count').textContent = streamerData.length;
    document.getElementById('tag-count').textContent = tags.length;
  });
}

// 설정 내보내기 함수
function exportSettings() {
  chrome.storage.local.get(["streamerData", "tags"], function(result) {
    const json = JSON.stringify(result, null, 2);
    const data = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;

    const date = new Date();
    const yyMMdd = `${date.getFullYear().toString().slice(2)}${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;

    a.download = `chzzk_filter_${yyMMdd}.json`;
    a.click();

    URL.revokeObjectURL(url);
  });
}

// 설정 불러오기 함수
function importSettings(e) {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // 이전 버전 호환성 처리
      if (data.streamerNames && !data.streamerData) {
        data.streamerData = data.streamerNames.map((name, index) => ({
          name,
          id: null,
          blockedAt: new Date().toISOString(),
          order: index
        }));
        delete data.streamerNames;
      }
      
      if (!data.streamerData && !data.tags) {
        alert('파일 형식이 부적절합니다.');
        return;
      }
      
      chrome.storage.local.set({
        streamerData: data.streamerData || [],
        tags: data.tags || []
      }, () => {
        loadData();
        alert('설정을 성공적으로 불러왔습니다.');
      });
    } catch (error) {
      alert('파일 형식이 부적절합니다.');
    }
  };
  
  reader.readAsText(file);
}

// 메모 팝업 표시 함수
function showMemoPopup(streamer, x, y) {
  currentStreamer = streamer;
  memoContent.value = streamer.memo || '';
  document.getElementById('streamer-id').value = streamer.id || '';
  
  memoPopup.style.display = 'block';
  
  // 팝업이 화면을 벗어나지 않도록 위치 조정
  const popupRect = memoPopup.getBoundingClientRect();
  const maxX = window.innerWidth - popupRect.width;
  const maxY = window.innerHeight - popupRect.height;
  
  memoPopup.style.left = Math.min(x, maxX) + 'px';
  memoPopup.style.top = Math.min(y, maxY) + 'px';
}

// 메모 팝업 닫기 함수
function closeMemoPopup() {
  memoPopup.style.display = 'none';
  currentStreamer = null;
  memoContent.value = '';
  document.getElementById('streamer-id').value = '';
}

// 메모 저장 함수
function saveMemo() {
  if (!currentStreamer) return;
  
  const memo = memoContent.value.trim();
  const streamerId = document.getElementById('streamer-id').value.trim();
  
  chrome.storage.local.get(['streamerData'], function(result) {
    const streamerData = result.streamerData || [];
    const streamerIndex = streamerData.findIndex(s => s.name === currentStreamer.name);
    
    if (streamerIndex !== -1) {
      streamerData[streamerIndex].memo = memo;
      streamerData[streamerIndex].id = streamerId || null;
      chrome.storage.local.set({streamerData}, function() {
        closeMemoPopup();
        loadData(); // UI 업데이트
      });
    }
  });
}
