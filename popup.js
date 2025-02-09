
document.getElementById('add-btn').addEventListener('click',function(){
  const inputWrap = document.getElementById('input-wrap')
  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'flex'
  input.placeholder = '스트리머명을 입력하세요'
  inputWrap.appendChild(input)
  const deleteButton = document.createElement('button')
  deleteButton.innerText = '삭제'
  deleteButton.addEventListener('click', function(){
    const input = this.previousElementSibling
    input.remove()
    this.remove()
    chrome.storage.sync.get(['streamerNames'], function(result) {
      const values = result.streamerNames || []
      const filtered = values.filter(item => item !== input.value)
      chrome.storage.sync.set({ 'streamerNames': filtered }, function() {
        console.log('삭제 완료:', filtered)
      })
    })
  })
  inputWrap.appendChild(deleteButton)

  // 입력값이 변경될 때마다 저장
  input.addEventListener('input', function() {
    saveInputs()
  })
})
function saveInputs() {
  const inputs = document.querySelectorAll('#input-wrap input')
  const values = Array.from(inputs).map(input => input.value).filter(value => value.trim())
  chrome.storage.sync.set({ 'streamerNames': values }, function() {
    console.log('저장 완료:', values)
  })
}
function loadInputs() {
  chrome.storage.sync.get(['streamerNames'], function(result) {
    const values = result.streamerNames || []
    const inputWrap = document.getElementById('input-wrap')
    values.forEach((value) => {
      const input = document.createElement('input')
      input.type = 'text'
      input.placeholder = '스트리머명을 입력하세요'
      input.className = 'flex'
      input.value = value
      inputWrap.appendChild(input)

      const deleteButton = document.createElement('button')
      deleteButton.innerText = '삭제'
      deleteButton.addEventListener('click', function(){
        const input = this.previousElementSibling
        input.remove()
        this.remove()
        chrome.storage.sync.get(['streamerNames'], function(result) {
          const values = result.streamerNames || []
          const filtered = values.filter(item => item !== input.value)
          chrome.storage.sync.set({ 'streamerNames': filtered }, function() {
            console.log('삭제 완료:', filtered)
          })
        })
      })
      inputWrap.appendChild(deleteButton)

      // 입력값이 변경될 때마다 저장
      input.addEventListener('input', function() {
        saveInputs()
      })
    })
  })
}

// 페이지 로드 시 저장된 값을 불러옴
document.addEventListener('DOMContentLoaded', loadInputs)
