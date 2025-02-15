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
      chrome.storage.sync.set({'streamerNames': filtered})
    })
  })
  inputWrap.appendChild(deleteButton)

  // 입력값이 변경될 때마다 저장
  input.addEventListener('input', saveInputs)
})

document.getElementById("export").addEventListener("click", function () {
  chrome.storage.sync.get(["streamerNames", "tags"], function (result) {
    const json = JSON.stringify(result, null, 2)
    const data = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(data)
    const a = document.createElement("a")
    a.href = url

    const date = new Date()
    const yyMMdd = `${date.getFullYear().toString().slice(2)}${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`

    a.download = `chzzk_filter_${yyMMdd}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
  })
})

document.getElementById('import').addEventListener('change', function(){
  const file = this.files[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result)
      const {streamerNames, tags} = data
      if(!streamerNames || !tags) {
        alert('파일 형식이 부적절합니다.')
        return
      }
      chrome.storage.sync.set({tags, streamerNames})
      // 기존 인풋 다 삭제 후 로드
      const inputWrap = document.getElementById('input-wrap')
      while(inputWrap.firstChild){
        inputWrap.removeChild(inputWrap.firstChild)
      }
      loadInputs()
    } catch (error) {
      alert('파일 형식이 부적절합니다.')
    }
  }
  reader.readAsText(file)
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
      chrome.storage.sync.set({'tags': filtered})
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
  chrome.storage.sync.set({streamerNames, tags})
}

function loadInputs() {
  chrome.storage.sync.get(['streamerNames', 'tags'], function (result) {
    const streamerNames = result.streamerNames ?? []
    const tags = result.tags ?? []
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
          chrome.storage.sync.set({'streamerNames': filtered})
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
document.addEventListener('DOMContentLoaded', loadInputs)
