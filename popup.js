document.getElementById('delat-input').addEventListener('change', function(){
  chrome.storage.sync.set({'delay': this.value})
})

function loadDelay(){
  chrome.storage.sync.get(['delay'], function (result) {
    document.getElementById('delat-input').value = result.delay || 100
  })
}

document.getElementById('add-btn').addEventListener('click', function () {
  const inputWrap = document.getElementById('input-wrap')
  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'flex'
  input.placeholder = '스트리머명을 입력하세요'
  inputWrap.appendChild(input)
  const deleteButton = document.createElement('button')
  deleteButton.innerText = '스트리머 삭제'
  deleteButton.addEventListener('click', function () {
    const input = this.previousElementSibling
    input.remove()
    this.remove()
    chrome.storage.sync.get(['streamerNames', 'tags'], function (result) {
      const values = result.streamerNames
      const filtered = values.filter(item => item !== input.value)
      chrome.storage.sync.set({'streamerNames': filtered}, function () {
        console.log('삭제 완료:', filtered)
      })
    })
  })
  inputWrap.appendChild(deleteButton)

  // 입력값이 변경될 때마다 저장
  input.addEventListener('input', saveInputs)
})
document.getElementById('tag-add-btn').addEventListener('click', function () {
  const inputWrap = document.getElementById('input-wrap')
  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'flex'
  input.placeholder = '태그명을 입력하세요'
  inputWrap.appendChild(input)
  const deleteButton = document.createElement('button')
  deleteButton.innerText = '태그 삭제'
  deleteButton.addEventListener('click', function () {
    const input = this.previousElementSibling
    input.remove()
    this.remove()
    chrome.storage.sync.get(['tags'], function (result) {
      const values = result.tags || []
      const filtered = values.filter(item => item !== input.value)
      chrome.storage.sync.set({'tags': filtered}, function () {
        console.log('삭제 완료:', filtered)
      })
    })
  })
  inputWrap.appendChild(deleteButton)

  // 입력값이 변경될 때마다 저장
  input.addEventListener('input', saveInputs)
})

function saveInputs() {
  const inputs = document.querySelectorAll('#input-wrap input')
  const [streamerNames, tags] = Array.from(inputs).reduce((acc, input) => {
    if (input.value.trim() === '') {
      return acc
    }
    if (input.placeholder === '태그명을 입력하세요') {
      acc[1].push(input.value)
    } else {
      acc[0].push(input.value)
    }
    return acc
  }, [[], []])
  chrome.storage.sync.set({streamerNames, tags}, function () {
    console.log('저장 완료:')
  })
}

function loadInputs() {
  chrome.storage.sync.get(['streamerNames', 'tags'], function (result) {
    const {streamerNames, tags} = result
    const inputWrap = document.getElementById('input-wrap')
    streamerNames.forEach((value) => {
      const input = document.createElement('input')
      input.type = 'text'
      input.placeholder = '스트리머명을 입력하세요'
      input.className = 'flex'
      input.value = value
      inputWrap.appendChild(input)

      const deleteButton = document.createElement('button')
      deleteButton.innerText = '스트리머 삭제'
      deleteButton.addEventListener('click', function () {
        const input = this.previousElementSibling
        input.remove()
        this.remove()
        chrome.storage.sync.get(['streamerNames'], function (result) {
          const values = result.streamerNames || []
          const filtered = values.filter(item => item !== input.value)
          chrome.storage.sync.set({'streamerNames': filtered}, function () {
            console.log('삭제 완료:', filtered)
          })
        })
      })
      inputWrap.appendChild(deleteButton)

      // 입력값이 변경될 때마다 저장
      input.addEventListener('input', saveInputs)
    })
    tags.forEach((value) => {
      const input = document.createElement('input')
      input.type = 'text'
      input.placeholder = '태그명을 입력하세요'
      input.className = 'flex'
      input.value = value
      inputWrap.appendChild(input)

      const deleteButton = document.createElement('button')
      deleteButton.innerText = '태그 삭제'
      deleteButton.addEventListener('click', function () {
        const input = this.previousElementSibling
        input.remove()
        this.remove()
        chrome.storage.sync.get(['tags'], function (result) {
          const values = result.tags || []
          const filtered = values.filter(item => item !== input.value)
          chrome.storage.sync.set({'tags': filtered}, function () {
            console.log('삭제 완료:', filtered)
          })
        })
      })
      inputWrap.appendChild(deleteButton)

      input.addEventListener('input', saveInputs)
    })
  })
}

// 페이지 로드 시 저장된 값을 불러옴
document.addEventListener('DOMContentLoaded', function (){
  loadInputs()
  loadDelay()
})
