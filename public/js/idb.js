let db
const request = indexedDB.open('budget_tracker', 1)

//This event listener will kick off db version changes: version1 -> version2 -> version3 etc.
request.onupgradeneeded = function(event){
    const db = event.target.result
    db.createObjectStore('new_entry', { autoIncrement: true })
}

//If connection to database is successful...
request.onsuccess = function(event){
    db = event.target.result
    if(navigator.online){
        uploadEntry()
    }
}

//if connection to database has error
request.onerror = function(event){
    console.log(event.target.errorCode)
}

//When we try to make a new entry but theres no internet connection, we save a record of the new entry that was attempted
function saveRecord(record) {
    //this transaction open a temporary connection to the db
    const transaction = db.transaction(['new_entry'], 'readwrite')
    const entryObjectStore = transaction.objectStore('new_entry')
    entryObjectStore.add(record)
}

function uploadEntry() {
    const transaction = db.transaction(['new_entry'], 'readwrite')
    const entryObjectStore = transaction.objectStore('new_entry')
    const getAll = entryObjectStore.getAll()

    getAll.onsuccess = function(){
        if(getAll.result.length > 0){
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message){
                    throw new Error(serverResponse)
                }
                const transaction = db.transaction(['new_entry'], 'readwrite')
                const entryObjectStore = transaction.objectStore('new_entry')
                entryObjectStore.clear()

                alert('All saved entries have been submitted!')
            })
            .catch( err => {
                console.log(err)
            })
        }
    }
}

window.addEventListener('online', uploadEntry)