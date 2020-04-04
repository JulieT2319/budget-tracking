let db;
//request specific database with indexedDB open method
const request = indexedDB.open("budget", 1);

//request data from database
request.onsuccess = ({ target }) => {
  db = target.result;

  //if app is online, read database
  if (navigator.online) {
    checkDatabase();
  }
}

//create storage for pending items
request.onupgradeneeded = ({ target }) => {
  const db = target.result;
  const pendingItem = db.createObjectStore("pending", { autoIncrement: true });
};

//log errors
request.onerror = function ({ target }) {
  ("you have recieved error code " + target.errorCode)
};


//save record
function saveRecord(record) {
  //create budget entry
  const transaction = db.transaction(["pending"], "readwrite");
  //access storage
  const store = transaction.objectStore("pending");
  //add record to storage
  store.add(record);
}

//import online database
function checkDatabase() {
  //open offline database
  const transaction = db.transaction(["pending"], "readwrite");
  //access storage
  const store = transaction.objectStore("pending");
  //get records from storage
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    //post data to online database
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*", "Content-Type": "application/json"
        }
      }).then(response => response.json()).then(() => {
        //clear pending entries from database
        const transaction = db.transaction(["pending"], "readwrite");
        const store = transaction.objectStore("pending");
        store.clear();
      });
    };
  };
};

//listen for coming online
window.addEventListener("online", checkDatabase)