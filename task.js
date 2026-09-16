/* ============================================================
   STATE
   ============================================================ */
let employees = [];        // full master list (API + locally added)
let currentDept = "All";
let currentSearch = "";
let currentSort = "none";
let nextLocalId = 9000;

/* ============================================================
   DATE & TIME
   ============================================================ */
function updateClock(){
  const now = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  let hours = now.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = String(now.getMinutes()).padStart(2, "0");
  const secs = String(now.getSeconds()).padStart(2, "0");
  document.getElementById("clockDate").textContent = dateStr;
  document.getElementById("clockTime").textContent = `${String(hours).padStart(2,"0")}:${mins}:${secs} ${ampm}`;
}
updateClock();
setInterval(updateClock, 1000);

/* ============================================================
   API FETCH
   ============================================================ */
function setStatus(msg, type){
  const el = document.getElementById("statusLine");
  el.textContent = msg;
  el.className = type || "";
}

function fetchEmployees(){
  setStatus("Loading employees…", "");
  fetch("https://dummyjson.com/users?limit=30")
    .then(res => {
      if(!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then(data => {
      const departments = ["IT", "HR", "Finance", "Marketing"];
      const apiEmployees = data.users.map((u, i) => {
        return {
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          age: u.age,
          email: u.email,
          phone: u.phone,
          company: u.company ? u.company.name : "—",
          department: departments[i % departments.length],
          image: u.image,
          salary: null,      // API users have no salary — only locally added staff feed payroll totals
          isLocal: false
        };
      });
      employees = apiEmployees;
      setStatus("Employee data loaded successfully.", "ok");
    })
    .catch(err => {
      console.error(err);
      setStatus("Unable to load employee data. Please try again.", "err");
    })
    .finally(() => {
      renderAll();
    });
}

/* ============================================================
   DERIVED / DISPLAY LOGIC
   ============================================================ */
function getFilteredEmployees(){
  let result = employees;

  // department filter
  if(currentDept !== "All"){
    result = result.filter(emp => emp.department === currentDept);
  }

  // search filter
  if(currentSearch.trim() !== ""){
    const q = currentSearch.trim().toLowerCase();
    result = result.filter(emp => emp.name.toLowerCase().includes(q));
  }

  // sorting
  if(currentSort !== "none"){
    result = [...result].sort((a, b) => {
      switch(currentSort){
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "age-asc": return a.age - b.age;
        case "age-desc": return b.age - a.age;
        case "salary-asc": return (a.salary || 0) - (b.salary || 0);
        case "salary-desc": return (b.salary || 0) - (a.salary || 0);
        default: return 0;
      }
    });
  }

  return result;
}

function displayEmployees(){
  const grid = document.getElementById("employeeGrid");
  const list = getFilteredEmployees();
  grid.innerHTML = "";

  if(list.length === 0){
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No matching employees found.";
    grid.appendChild(empty);
    updateEmployeeCount(list);
    return;
  }

  list.forEach(emp => {
    const card = document.createElement("div");
    card.className = "card";

    const top = document.createElement("div");
    top.className = "card-top";

    const img = document.createElement("img");
    img.src = emp.image || `https://i.pravatar.cc/80?u=${emp.id}`;
    img.alt = emp.name;
    top.appendChild(img);

    const nameWrap = document.createElement("div");
    const nameEl = document.createElement("div");
    nameEl.className = "card-name";
    nameEl.textContent = emp.name;
    const deptEl = document.createElement("span");
    deptEl.className = "card-dept";
    deptEl.textContent = emp.department;
    nameWrap.appendChild(nameEl);
    nameWrap.appendChild(deptEl);
    top.appendChild(nameWrap);

    card.appendChild(top);

    const fields = document.createElement("div");
    fields.className = "card-fields";
    fields.innerHTML = `
      <span class="k">Age</span><span class="v">${emp.age}</span>
      <span class="k">Email</span><span class="v">${emp.email}</span>
      <span class="k">Phone</span><span class="v">${emp.phone || "—"}</span>
    `;
    card.appendChild(fields);

    if(emp.salary){
      const salaryEl = document.createElement("div");
      salaryEl.className = "card-salary";
      salaryEl.textContent = `Salary: ₹${emp.salary.toLocaleString("en-IN")}`;
      card.appendChild(salaryEl);
    }

    const actions = document.createElement("div");
    actions.className = "card-actions";
    const delBtn = document.createElement("button");
    delBtn.className = "btn-delete";
    delBtn.textContent = "DELETE";
    delBtn.addEventListener("click", () => deleteEmployee(emp.id));
    actions.appendChild(delBtn);
    card.appendChild(actions);

    grid.appendChild(card);
  });

  updateEmployeeCount(list);
}

function updateEmployeeCount(list){
  const label = currentDept === "All" ? "Total Employees" : `${currentDept} Employees`;
  document.getElementById("countStrip").innerHTML = `${label}: <b>${list.length}</b>`;
}

function renderAll(){
  displayEmployees();
  calculateSalary();
}

/* ============================================================
   SEARCH
   ============================================================ */
document.getElementById("searchBtn").addEventListener("click", () => {
  currentSearch = document.getElementById("searchInput").value;
  displayEmployees();
});
document.getElementById("searchInput").addEventListener("input", (e) => {
  currentSearch = e.target.value;
  displayEmployees();
});

/* ============================================================
   DEPARTMENT FILTER
   ============================================================ */
function filterDepartment(dept){
  currentDept = dept;
  document.querySelectorAll("#deptTabs button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.dept === dept);
  });
  displayEmployees();
}
document.getElementById("deptTabs").addEventListener("click", (e) => {
  if(e.target.tagName === "BUTTON"){
    filterDepartment(e.target.dataset.dept);
  }
});

/* ============================================================
   SORT
   ============================================================ */
function sortEmployees(sortValue){
  currentSort = sortValue;
  displayEmployees();
}
document.getElementById("sortSelect").addEventListener("change", (e) => {
  sortEmployees(e.target.value);
});

/* ============================================================
   VALIDATION
   ============================================================ */
function clearFieldErrors(){
  ["f-name","f-age","f-email","f-dept","f-salary"].forEach(id => {
    document.getElementById(id).classList.remove("error");
  });
}

function validateEmployee({ name, age, email, department, salary }){
  let valid = true;

  if(!name || name.trim() === ""){
    document.getElementById("f-name").classList.add("error");
    valid = false;
  }
  if(!age || age <= 18){
    document.getElementById("f-age").classList.add("error");
    valid = false;
  }
  if(!email || email.trim() === "" || !email.includes("@")){
    document.getElementById("f-email").classList.add("error");
    valid = false;
  }
  if(!department){
    document.getElementById("f-dept").classList.add("error");
    valid = false;
  }
  if(salary === null || isNaN(salary) || salary <= 0){
    document.getElementById("f-salary").classList.add("error");
    valid = false;
  }

  return valid;
}

/* ============================================================
   ADD EMPLOYEE
   ============================================================ */
function clearForm(){
  document.getElementById("inName").value = "";
  document.getElementById("inAge").value = "";
  document.getElementById("inEmail").value = "";
  document.getElementById("inDept").value = "";
  document.getElementById("inSalary").value = "";
  clearFieldErrors();
}

function addEmployee(){
  clearFieldErrors();

  const name = document.getElementById("inName").value;
  const age = parseInt(document.getElementById("inAge").value, 10);
  const email = document.getElementById("inEmail").value;
  const department = document.getElementById("inDept").value;
  const salary = parseInt(document.getElementById("inSalary").value, 10);

  const candidate = { name, age, email, department, salary };

  if(!validateEmployee(candidate)){
    return;
  }

  const newEmployee = {
    id: nextLocalId++,
    name: name.trim(),
    age,
    email: email.trim(),
    phone: "—",
    company: "In-house",
    department,
    image: `https://i.pravatar.cc/80?u=${nextLocalId}`,
    salary,
    isLocal: true
  };

  employees = [...employees, newEmployee];
  clearForm();
  renderAll();
}
document.getElementById("addBtn").addEventListener("click", addEmployee);

/* ============================================================
   DELETE EMPLOYEE
   ============================================================ */
function deleteEmployee(id){
  employees = employees.filter(emp => emp.id !== id);
  renderAll();
}

/* ============================================================
   SALARY CALCULATION (locally added staff only, since API
   users don't come with salary data)
   ============================================================ */
function calculateSalary(){
  const paidStaff = employees.filter(emp => emp.salary && emp.salary > 0);

  const totalSalary = paidStaff.reduce((sum, emp) => sum + emp.salary, 0);
  const avgSalary = paidStaff.length ? Math.round(totalSalary / paidStaff.length) : 0;

  document.getElementById("statTotal").textContent = employees.length;
  document.getElementById("statTotalSalary").textContent = `₹${totalSalary.toLocaleString("en-IN")}`;
  document.getElementById("statAvgSalary").textContent = `₹${avgSalary.toLocaleString("en-IN")}`;

  const topPaid = paidStaff.reduce((top, emp) => {
    return (!top || emp.salary > top.salary) ? emp : top;
  }, null);

  document.getElementById("statTopPaid").textContent = topPaid
    ? `${topPaid.name} — ₹${topPaid.salary.toLocaleString("en-IN")}`
    : "—";
}

/* ============================================================
   INIT
   ============================================================ */
fetchEmployees();
